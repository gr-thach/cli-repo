const { MultiSamlStrategy } = require('passport-saml');
const { Router } = require('express');
const boom = require('@hapi/boom');
const _ = require('lodash');
const { constants } = require('../../../../config');
const { validateGitProvider, validateSamlOptions } = require('./validation');
const reportError = require('../../../../sentry');
const { env } = require('../../../../config');

const base64Decode = data => {
  return Buffer.from(data, 'base64').toString('ascii');
};

function getSamlOptionsByGitProvider(gitProvider) {
  if (!constants.saml) {
    throw new Error('Saml constants are not defined');
  }

  const config = constants.saml[gitProvider];

  if (!config) {
    throw new Error(`Failed to get saml configurations, unexpected git provider ${gitProvider}.`);
  }

  return {
    // Cert is the public certificate that comes from the identity provider.
    // This is used for verifying that the response that we get in the callback
    // really comes from the identity provider.
    cert: config.cert && base64Decode(config.cert),
    // Entry point is the url to the login page of the saml identity provider.
    entryPoint: config.entryPoint,
    // The callback path where they should send their response. Not really sure why this is needed as they will configure
    // the full url in the identity provider.
    path: `/authorize/saml/on-premise/${gitProvider}/callback`,
    // Saml integration admins will enter this in their identity provider (azure, okta etc).
    // So we can't change this as this will break our Saml integrations.
    issuer: `${env.API_EXTERNAL_URL}/authorize/saml/on-premise/${gitProvider}`,
    // This field should be the same as the issuer field.
    // This is also not allowed to be changed as it will be entered in the identity provider.
    audience: `${env.API_EXTERNAL_URL}/authorize/saml/on-premise/${gitProvider}`,
    // By default this value is set to email format, but we would prefer that they send us a unique id for each user instead.
    // This is because a user could change their email address in the identity provider.
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'
  };
}

const getSamlOptions = async (req, done) => {
  try {
    const { gitProvider } = req.params;
    validateGitProvider(gitProvider);

    const options = getSamlOptionsByGitProvider(gitProvider);
    validateSamlOptions(options);

    return done(null, options);
  } catch (err) {
    return done(err);
  }
};

const handleSamlLibraryError = err => {
  // Can happen if the certificate they have configured in GuardRails don't match the one they have in their identity provider.
  if (err.message === 'Invalid signature') {
    throw boom.badRequest(
      'Invalid saml certificate signature. Contact your single-sign-on administrator.'
    );
  }

  // Can happen if admin has not configured the indentifier (issuer) field correctly in their identity provider.
  if (err.message === 'SAML assertion audience mismatch') {
    throw boom.badRequest(
      'SAML assertion audience mismatch. Contact your single-sign-on administrator.'
    );
  }

  // Can happen if admin has added extra characters at the start of the certificate.
  if (err.message === 'error:0909006C:PEM routines:get_name:no start line') {
    throw boom.badRequest(
      'Invalid saml certificate format. Contact your single-sign-on administrator.'
    );
  }

  // Can happen if admin has added extra characters at the end of the certificate.
  if (err.message === 'error:0908F066:PEM routines:get_header_and_data:bad end line') {
    throw boom.badRequest(
      'Invalid saml certificate format. Contact your single-sign-on administrator.'
    );
  }

  throw err;
};

const isUserError = err => {
  return err && err.isBoom && !err.isServer;
};

const errorRedirect = (res, err) => {
  const message = isUserError(err) ? _.get(err, 'output.payload.message') : 'internal server error';
  return res.redirect(
    `${constants.dashboardBaseUrl}?gr-saml-auth-on-premise=error&message=${message}`
  );
};

const okRedirect = (res, gitProvider) => {
  return res.redirect(
    `${constants.dashboardBaseUrl}?gr-saml-auth-on-premise=ok&git-provider=${gitProvider}`
  );
};

/*
 * This is the callback that we get from the saml provider after
 * the user has been verified (logged in) at the saml provider.
 */
const onSamlCallback = async (error, req, res) => {
  try {
    if (error) {
      handleSamlLibraryError(error);
    }

    const { gitProvider } = req.params;
    validateGitProvider(gitProvider);

    return okRedirect(res, gitProvider);
  } catch (err) {
    if (!isUserError(err)) {
      await reportError(err);
    }

    return errorRedirect(res, err);
  }
};

const samlEndpointsOnPremise = passport => {
  return (
    Router()
      .get(
        '/authorize/saml/on-premise/:gitProvider',
        passport.authenticate('saml-on-premise', { failureRedirect: '/', failureFlash: true }),
        (req, res) => {
          res.end();
        }
      )
      // NOTE: Changing this url will break the saml integration for our users.
      // Users will add this url in their saml identity provider, so do not change this.
      .post('/authorize/saml/on-premise/:gitProvider/callback', (req, res, next) => {
        passport.authenticate('saml-on-premise', err => {
          onSamlCallback(err, req, res);
        })(req, res, next);
      })
  );
};

const samlStrategyOnPremise = new MultiSamlStrategy(
  {
    name: 'saml-on-premise',
    passReqToCallback: true,
    getSamlOptions
  },
  (req, profile, done) => {
    done(null, profile);
  }
);

module.exports = {
  samlStrategyOnPremise,
  samlEndpointsOnPremise
};
