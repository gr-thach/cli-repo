"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("jest-express/lib/express");
const request_1 = require("jest-express/lib/request");
const response_1 = require("jest-express/lib/response");
const passport_mock_1 = require("../mocks/passport-mock");
const express_mock_1 = require("../mocks/express-mock");
const passport_1 = __importDefault(require("../../src/auth/passport"));
jest.mock('../../src/auth/saml/public/passportSaml');
jest.mock('../../src/helpers/core-api/users');
jest.mock('passport', () => passport_mock_1.PassportMock);
jest.mock('../../config', () => ({
    constants: {
        dashboardBaseUrl: 'https://dashboard.example.com'
    },
    env: {
        AUTH_ALLOWED_EMAIL_DOMAINS: ['example.com'],
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY: 'dummy-consumer-key',
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET: 'dummy-consumer-secret'
    }
}));
describe('passport email domain whitelisting', () => {
    let app;
    let res;
    const next = jest.fn();
    beforeEach(() => {
        app = new express_1.Express();
        app.resetMocked();
        jest.clearAllMocks();
        res = new response_1.Response();
        passport_mock_1.PassportMock.initMock();
        (0, passport_1.default)(app);
    });
    const oauthAuthenticateCallback = async (provider, user) => {
        const endpoint = (0, express_mock_1.getEndpoint)(app, 'get', '/authorize/:gitprovider/callback');
        const req = new request_1.Request();
        req.setParams({ gitprovider: provider });
        endpoint(req, res, next);
        await passport_mock_1.PassportMock.callback(null, user);
        passport_mock_1.PassportMock.expectAuthenticateToHaveBeenCalledWithProvider(provider);
        passport_mock_1.PassportMock.expectAuthenticateReturnFuctionToHaveBeenCalledWith(req, res, next);
    };
    it('Bitbucket Data Center: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
        const bitbucketDataCenterUser = {
            emailAddress: undefined
        };
        await oauthAuthenticateCallback('BITBUCKET-DATA-CENTER', bitbucketDataCenterUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED');
    });
    it('Github: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
        const githubUser = {
            emails: []
        };
        await oauthAuthenticateCallback('GITHUB', githubUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED');
    });
    it('Gitlab: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
        const gitlabUser = {
            emails: []
        };
        await oauthAuthenticateCallback('GITLAB', gitlabUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED');
    });
    it('Bitbucket: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
        const bitbucketUser = {
            emails: []
        };
        await oauthAuthenticateCallback('BITBUCKET', bitbucketUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED');
    });
    it('Bitbucket Data Center: Should return error if email domain is not in the whitelist', async () => {
        const bitbucketDataCenterUser = {
            emailAddress: 'test@not.allowed.domain.com'
        };
        await oauthAuthenticateCallback('BITBUCKET-DATA-CENTER', bitbucketDataCenterUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED');
    });
    it('Github: Should return error if email domain is not in the whitelist', async () => {
        const githubUser = {
            emails: [
                {
                    value: 'test2@not.allowed.domain.com'
                }
            ]
        };
        await oauthAuthenticateCallback('GITHUB', githubUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED');
    });
    it('Gitlab: Should return error if email domain is not in the whitelist', async () => {
        const gitlabUser = {
            emails: [
                {
                    value: 'test3@not.allowed.domain.com'
                }
            ]
        };
        await oauthAuthenticateCallback('GITLAB', gitlabUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED');
    });
    it('Bitbucket: Should return error if email domain is not in the whitelist', async () => {
        const bitbucketUser = {
            emails: [
                {
                    primary: true,
                    verified: true,
                    value: 'test4@not.allowed.domain.com'
                }
            ]
        };
        await oauthAuthenticateCallback('BITBUCKET', bitbucketUser);
        expect(res.statusCode).toEqual(307);
        expect(res.redirect).toBeCalledWith('https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED');
    });
});
//# sourceMappingURL=passport-email-domain-whitelisting.test.js.map