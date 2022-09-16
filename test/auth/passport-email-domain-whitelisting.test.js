import { Express } from 'jest-express/lib/express';
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';
import { PassportMock } from '../mocks/passport-mock';
import { getEndpoint } from '../mocks/express-mock';
import initPassport from '../../src/auth/passport';

jest.mock('../../src/auth/saml/public/passportSaml');
jest.mock('../../src/helpers/core-api/users');
jest.mock('passport', () => PassportMock);
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
    app = new Express();
    app.resetMocked();
    jest.clearAllMocks();
    res = new Response();
    PassportMock.initMock();
    initPassport(app);
  });

  const oauthAuthenticateCallback = async (provider, user) => {
    const endpoint = getEndpoint(app, 'get', '/authorize/:gitprovider/callback');

    const req = new Request();
    req.setParams({ gitprovider: provider });

    endpoint(req, res, next);
    await PassportMock.callback(null, user);

    PassportMock.expectAuthenticateToHaveBeenCalledWithProvider(provider);
    PassportMock.expectAuthenticateReturnFuctionToHaveBeenCalledWith(req, res, next);
  };

  it('Bitbucket Data Center: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
    const bitbucketDataCenterUser = {
      emailAddress: undefined
    };

    await oauthAuthenticateCallback('BITBUCKET-DATA-CENTER', bitbucketDataCenterUser);

    expect(res.statusCode).toEqual(307);
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED'
    );
  });

  it('Github: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
    const githubUser = {
      emails: []
    };

    await oauthAuthenticateCallback('GITHUB', githubUser);

    expect(res.statusCode).toEqual(307);
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED'
    );
  });

  it('Gitlab: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
    const gitlabUser = {
      emails: []
    };

    await oauthAuthenticateCallback('GITLAB', gitlabUser);

    expect(res.statusCode).toEqual(307);
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED'
    );
  });

  it('Bitbucket: Should return error if no email is returned from oauth provider and only certain email domains should be allowed to login', async () => {
    const bitbucketUser = {
      emails: []
    };

    await oauthAuthenticateCallback('BITBUCKET', bitbucketUser);

    expect(res.statusCode).toEqual(307);
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=NO_EMAIL_PROVIDED'
    );
  });

  it('Bitbucket Data Center: Should return error if email domain is not in the whitelist', async () => {
    const bitbucketDataCenterUser = {
      emailAddress: 'test@not.allowed.domain.com'
    };

    await oauthAuthenticateCallback('BITBUCKET-DATA-CENTER', bitbucketDataCenterUser);

    expect(res.statusCode).toEqual(307);
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED'
    );
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
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED'
    );
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
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED'
    );
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
    expect(res.redirect).toBeCalledWith(
      'https://dashboard.example.com?grauth=error&state=&errorCode=EMAIL_DOMAIN_NOT_ALLOWED'
    );
  });
});
