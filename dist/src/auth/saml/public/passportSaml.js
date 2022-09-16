"use strict";
const { MultiSamlStrategy } = require('passport-saml');
const get = require('lodash/get');
const { Router } = require('express');
const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
const { v4: uuid } = require('uuid');
const { findSamlProviderById } = require('../../../helpers/core-api/samlProviders');
const { createSamlUser, updateSamlUser, findSamlUserByExternalId } = require('../../../helpers/core-api/samlUsers');
const { findUserById } = require('../../../helpers/core-api/users');
const { env, constants } = require('../../../../config');
const reportError = require('../../../../sentry');
const { validateSamlUserCallback, validateSamlOptions, validateUser } = require('./validation');
const auth = require('../../auth');
const { decryptToken, encryptToken, isValidAccessToken, refreshAccessToken } = require('../../../helpers/auth');
const { Resource, PermissionAction } = require('../../../interfaces');
const PermissionService = require('../../../services/permissions/permission').default;
const PolicyService = require('../../../services/permissions/policy').default;
const { findAccountById } = require('../../../helpers/core-api/accounts');
const getSamlOptionsFromSamlProvider = samlProvider => {
    return {
        // Cert is the public certificate that comes from the identity provider.
        // This is used for verifying that the response that we get in the callback
        // really comes from the identity provider.
        cert: samlProvider.cert,
        // Entry point is the url to the login page of the saml identity provider.
        entryPoint: samlProvider.entryPoint,
        // The callback path where they should send their response. Not really sure why this is needed as they will configure
        // the full url in the identity provider.
        path: `/authorize/saml/provider/${samlProvider.idSamlProvider}/callback`,
        // Saml integration admins will enter this in their identity provider (azure, okta etc).
        // So we can't change this as this will break our Saml integrations.
        issuer: `${env.API_EXTERNAL_URL}/authorize/saml/provider/${samlProvider.idSamlProvider}`,
        // This field should be the same as the issuer field.
        // This is also not allowed to be changed as it will be entered in the identity provider.
        audience: `${env.API_EXTERNAL_URL}/authorize/saml/provider/${samlProvider.idSamlProvider}`,
        // By default this value is set to email format, but we would prefer that they send us a unique id for each user instead.
        // This is because a user could change their email address in the identity provider.
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'
    };
};
const getSamlOptions = async (req, done) => {
    try {
        const { idSamlProvider } = req.params;
        const samlProvider = await findSamlProviderById(idSamlProvider);
        if (!samlProvider) {
            throw boom.badRequest(`Invalid callback url. No saml provider exist with id ${idSamlProvider}.`);
        }
        const options = getSamlOptionsFromSamlProvider(samlProvider);
        validateSamlOptions(options);
        return done(null, options);
    }
    catch (err) {
        return done(err);
    }
};
const createJWTForSamlUser = (samlProvider, samlUser) => {
    return jwt.sign({
        idSamlUser: samlUser.idSamlUser,
        email: samlUser.email,
        fkSamlProvider: samlProvider.idSamlProvider
    }, env.GUARDRAILS_SAML_JWT_TOKEN_SECRET);
};
const createJWTForUser = user => {
    return auth.generateJWT([
        {
            provider: user.provider.toLowerCase(),
            access_token: user.providerAccessToken && decryptToken(user.providerAccessToken),
            access_token_secret: user.providerAccessTokenSecret && decryptToken(user.providerAccessTokenSecret),
            username: user.login,
            id: user.providerInternalId,
            name: user.name,
            email: user.email,
            avatar_url: user.avatarUrl
        }
    ], new Date(Date.now() + 2 * 60 * 60 * 1000).getTime());
};
const okRedirect = res => {
    return res.redirect(`${constants.dashboardBaseUrl}?grsamlauth=ok`);
};
const isUserError = err => {
    return err && err.isBoom && !err.isServer;
};
const errorRedirect = (res, err) => {
    const message = isUserError(err) ? get(err, 'output.payload.message') : 'internal server error';
    return res.redirect(`${constants.dashboardBaseUrl}?grsamlauth=error&message=${message}`);
};
const unlinkUser = async (idSamlUser) => {
    await updateSamlUser(idSamlUser, {
        fkUser: null
    });
};
const signInAsUser = async (idUser, idSamlUser, req) => {
    const user = await findUserById(idUser);
    validateUser(user);
    try {
        let accessToken;
        let accessTokenSecret;
        if (user.provider === 'BITBUCKET') {
            // Bitbucket access tokens become stale after 2 hours (https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html).
            // So we generate a new access token that is valid for 2 hours (the same time as our JWT tokens) everytime the user is logging in using saml.
            const refreshToken = decryptToken(user.providerRefreshToken);
            accessToken = await refreshAccessToken(refreshToken, user.provider);
            user.providerAccessToken = encryptToken(accessToken);
        }
        else {
            accessToken = decryptToken(user.providerAccessToken);
        }
        if (user.provider === 'BITBUCKET_DATA_CENTER') {
            accessTokenSecret = decryptToken(user.providerAccessTokenSecret);
        }
        if (!(await isValidAccessToken(accessToken, user.provider, null, accessTokenSecret))) {
            // If the access token in the database has become stale (Github tokens can become stale if user hasn't used them for 1 year) then unlink the user,
            // so the user will need to do the oauth flow again with the git provider and link the user.
            throw Error("Access token isn't valid on user, this could be because the access token has become stale.");
        }
        req.session.jwt = createJWTForUser(user);
    }
    catch (err) {
        // If this fails we assume that the refresh token is invalid, so we unlink the user that is connected to the saml user and let
        // the user login with the git provider again using the oauth flow.
        await unlinkUser(idSamlUser);
        req.session.jwt = undefined;
    }
};
const handleSamlLibraryError = err => {
    // Can happen if the certificate they have configured in GuardRails don't match the one they have in their identity provider.
    if (err.message === 'Invalid signature') {
        throw boom.badRequest('Invalid saml certificate signature. Contact your single-sign-on administrator.');
    }
    // Can happen if admin has not configured the indentifier (issuer) field correctly in their identity provider.
    if (err.message === 'SAML assertion audience mismatch') {
        throw boom.badRequest('SAML assertion audience mismatch. Contact your single-sign-on administrator.');
    }
    // Can happen if admin has added extra characters at the start of the certificate.
    if (err.message === 'error:0909006C:PEM routines:get_name:no start line') {
        throw boom.badRequest('Invalid saml certificate format. Contact your single-sign-on administrator.');
    }
    // Can happen if admin has added extra characters at the end of the certificate.
    if (err.message === 'error:0908F066:PEM routines:get_header_and_data:bad end line') {
        throw boom.badRequest('Invalid saml certificate format. Contact your single-sign-on administrator.');
    }
    throw err;
};
/*
 * This is the callback that we get from the saml provider after
 * the user has been verified (logged in) at the saml provider.
 */
const onSamlCallback = async (error, req, res, samlUserProfile) => {
    try {
        if (error) {
            handleSamlLibraryError(error);
        }
        // req.user is the user object that we get from the SAML provider.
        validateSamlUserCallback(samlUserProfile);
        const { nameID: externalId, email } = samlUserProfile;
        const { idSamlProvider } = req.params;
        if (!idSamlProvider) {
            throw new Error('Request parameter idSamlProvider is undefined');
        }
        const samlProvider = await findSamlProviderById(idSamlProvider);
        if (!samlProvider) {
            throw boom.badRequest(`Invalid callback url. No saml provider exist with id ${idSamlProvider}.`);
        }
        if (!samlProvider.enabled) {
            throw boom.badRequest('SAML provider is disabled in GuardRails settings.');
        }
        const account = await findAccountById(samlProvider.fkAccount);
        if (!account) {
            return boom.notFound('Account not found');
        }
        const policy = await PolicyService.createInstance(account);
        (await PermissionService.factory(policy, PermissionAction.READ, Resource.SAML)).enforce();
        let samlUser = await findSamlUserByExternalId(idSamlProvider, externalId);
        if (samlUser) {
            // If the saml user is linked to a "git user" then create
            // a valid JWT for that user so he/she will be automatically logged in into GuardRails as that Git user.
            if (samlUser.fkUser) {
                await signInAsUser(samlUser.fkUser, samlUser.idSamlUser, req);
            }
            else {
                // If the user is logged in to GuardRails with a git account, then logout that user.
                req.session.jwt = undefined;
            }
        }
        else {
            samlUser = await createSamlUser({
                idSamlUser: uuid(),
                fkSamlProvider: idSamlProvider,
                externalId,
                email,
                createdAt: new Date().toJSON()
            });
            // If the user is logged in to GuardRails with a git account, then logout that user.
            req.session.jwt = undefined;
        }
        req.session.samlJwt = createJWTForSamlUser(samlProvider, samlUser);
        return okRedirect(res);
    }
    catch (err) {
        if (!isUserError(err)) {
            await reportError(err);
        }
        return errorRedirect(res, err);
    }
};
const samlEndpoints = passport => {
    return (Router()
        .get('/authorize/saml/provider/:idSamlProvider', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }), (req, res) => {
        res.end();
    })
        // NOTE: Changing this url will break the saml integration for our users.
        // Users will add this url in their saml identity provider, so do not change this.
        .post('/authorize/saml/provider/:idSamlProvider/callback', (req, res, next) => {
        passport.authenticate('saml', (err, user) => {
            onSamlCallback(err, req, res, user);
        })(req, res, next);
    }));
};
const samlStrategy = new MultiSamlStrategy({
    passReqToCallback: true,
    getSamlOptions
}, (req, profile, done) => {
    done(null, profile);
});
module.exports = {
    samlStrategy,
    samlEndpoints
};
//# sourceMappingURL=passportSaml.js.map