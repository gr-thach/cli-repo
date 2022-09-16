// Type definitions for passport-bitbucket
// Project: https://github.com/jaredhanson/passport-bitbucket
// Definitions by: Yamil Friadenrich <https://github.com/yamilfrich>
// TypeScript Version: 3.9.9

declare module 'passport-bitbucket' {
  import passport = require('passport');
  import oauth2 = require('passport-oauth2');
  import express = require('express');
  import { OutgoingHttpHeaders } from 'http';

  export interface Profile extends passport.Profile {
    profileUrl: string;
  }

  export interface StrategyOption extends passport.AuthenticateOptions {
    callbackURL: string;

    requestTokenURL?: string | undefined;
    accessTokenURL?: string | undefined;
    userAuthorizationURL?: string | undefined;
    consumerKey?: string | undefined;
    consumerSecret?: string | undefined;
    customHeaders?: OutgoingHttpHeaders | undefined;

    userProfileURL?: string | undefined;
    includeEmail?: boolean | undefined;
    skipUserProfile?: boolean | undefined;

    sessionKey?: string | undefined;
    signatureMethod?: string | undefined;
  }

  export interface StrategyOptions extends StrategyOption {
    passReqToCallback?: false | undefined;
  }
  export interface StrategyOptionsWithRequest extends StrategyOption {
    passReqToCallback: true;
  }

  export class Strategy {
    constructor(options: StrategyOptions, verify: oauth2.VerifyFunction);

    // eslint-disable-next-line no-dupe-class-members
    constructor(options: StrategyOptionsWithRequest, verify: oauth2.VerifyFunctionWithRequest);

    userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void;

    name: string;

    authenticate(req: express.Request, options?: passport.AuthenticateOptions): void;
  }
}
