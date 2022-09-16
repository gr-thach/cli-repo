"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../config");
const auth_1 = require("../auth/auth");
/**
 * Get JWT token from request headers. The header should be in the following format "Authorization: bearer {jwt}".
 * Returns the JWT token or undefined if no token is found.
 */
const getJWTFromHeaders = (headers) => {
    if (!headers.authorization) {
        return undefined;
    }
    // The authorization header is in the format "Authorization: bearer {jwt}".
    const parts = headers.authorization.split(' ');
    if (parts.length !== 2) {
        throw boom_1.default.badRequest('Invalid authorization header format. Header should be in the following format "Authorization: bearer {jwt}".');
    }
    return parts[1];
};
const jwtMiddlewareCookie = async (req, _, next) => {
    const ignoreEndpoints = [
        ['/v2/saml/user/', 'GET'],
        ['/v2/saml/user/provider', 'GET']
    ];
    const shouldIgnore = ignoreEndpoints.find(([endpoint, method]) => {
        return endpoint === req.baseUrl + req.path && req.method === method;
    });
    if (shouldIgnore) {
        return next();
    }
    const JWT = getJWTFromHeaders(req.headers) || (req.session && req.session.jwt);
    try {
        (0, jsonwebtoken_1.verify)(JWT, config_1.env.GUARDRAILS_JWT_TOKEN_SECRET);
    }
    catch (e) {
        return next(boom_1.default.unauthorized(e instanceof jsonwebtoken_1.TokenExpiredError
            ? 'Expired authorization token'
            : 'Invalid authorization token'));
    }
    req.user = (0, auth_1.parseJWT)(JWT);
    return next();
};
exports.default = jwtMiddlewareCookie;
//# sourceMappingURL=jwtMiddlewareCookie.js.map