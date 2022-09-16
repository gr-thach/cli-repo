// Type definitions for passport-bitbucket-oauth20
// Project: https://github.com/saintedlama/passport-bitbucket-oauth2
// Definitions by: Yamil Friadenrich <https://github.com/yamilfrich>
// TypeScript Version: 3.9.9

declare module 'passport-bitbucket-oauth20' {
  import passport = require('passport');
  import oauth2 = require('passport-oauth2');
  import express = require('express');
  import { OutgoingHttpHeaders } from 'http';

  export interface Profile extends passport.Profile {
    profileUrl: string;
  }

  export interface StrategyOption extends passport.AuthenticateOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;

    scope?: string[] | undefined;
    userAgent?: string | undefined;

    authorizationURL?: string | undefined;
    tokenURL?: string | undefined;
    scopeSeparator?: string | undefined;
    customHeaders?: OutgoingHttpHeaders | undefined;
    skipEmails?: boolean | undefined;
    userProfileURL?: string | undefined;
    userEmailsURL?: string | undefined;
  }

  export type OAuth2StrategyOptionsWithoutRequiredURLs = Pick<
    oauth2._StrategyOptionsBase,
    Exclude<keyof oauth2._StrategyOptionsBase, 'authorizationURL' | 'tokenURL'>
  >;

  export interface _StrategyOptionsBase extends OAuth2StrategyOptionsWithoutRequiredURLs {
    clientID: string;
    clientSecret: string;
    callbackURL: string;

    scope?: string[] | undefined;
    userAgent?: string | undefined;
    state?: string | undefined;

    authorizationURL?: string | undefined;
    tokenURL?: string | undefined;
    scopeSeparator?: string | undefined;
    customHeaders?: OutgoingHttpHeaders | undefined;
    userProfileURL?: string | undefined;
    userEmailsURL?: string | undefined;
  }

  export interface StrategyOptions extends _StrategyOptionsBase {
    passReqToCallback?: false | undefined;
  }
  export interface StrategyOptionsWithRequest extends _StrategyOptionsBase {
    passReqToCallback: true;
  }

  export class Strategy extends oauth2.Strategy {
    constructor(options: StrategyOptions, verify: oauth2.VerifyFunction);

    // eslint-disable-next-line no-dupe-class-members
    constructor(options: StrategyOptionsWithRequest, verify: oauth2.VerifyFunctionWithRequest);

    userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void;

    name: string;

    authenticate(req: express.Request, options?: passport.AuthenticateOptions): void;
  }
}
