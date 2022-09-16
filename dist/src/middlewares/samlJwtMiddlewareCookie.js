"use strict";
const boom = require('@hapi/boom');
const { decode, verify, TokenExpiredError } = require('jsonwebtoken');
const { env } = require('../../config');
const samlJwtMiddlewareCookie = async (req, res, next) => {
    const JWT = req.session && req.session.samlJwt;
    try {
        verify(JWT, env.GUARDRAILS_SAML_JWT_TOKEN_SECRET);
    }
    catch (e) {
        return next(boom.unauthorized(e instanceof TokenExpiredError
            ? 'Expired saml authorization token'
            : 'Invalid saml authorization token'));
    }
    req.samlUser = decode(JWT);
    return next();
};
module.exports = samlJwtMiddlewareCookie;
//# sourceMappingURL=samlJwtMiddlewareCookie.js.map