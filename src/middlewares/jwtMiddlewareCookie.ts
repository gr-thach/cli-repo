import boom from '@hapi/boom';
import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../config';
import { parseJWT } from '../auth/auth';

/**
 * Get JWT token from request headers. The header should be in the following format "Authorization: bearer {jwt}".
 * Returns the JWT token or undefined if no token is found.
 */
const getJWTFromHeaders = (headers: IncomingHttpHeaders) => {
  if (!headers.authorization) {
    return undefined;
  }

  // The authorization header is in the format "Authorization: bearer {jwt}".
  const parts = headers.authorization.split(' ');

  if (parts.length !== 2) {
    throw boom.badRequest(
      'Invalid authorization header format. Header should be in the following format "Authorization: bearer {jwt}".'
    );
  }

  return parts[1];
};

const jwtMiddlewareCookie = async (req: Request, _: Response, next: NextFunction) => {
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
    verify(JWT, env.GUARDRAILS_JWT_TOKEN_SECRET);
  } catch (e) {
    return next(
      boom.unauthorized(
        e instanceof TokenExpiredError
          ? 'Expired authorization token'
          : 'Invalid authorization token'
      )
    );
  }

  req.user = parseJWT(JWT);
  return next();
};

export default jwtMiddlewareCookie;
