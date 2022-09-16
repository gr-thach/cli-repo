import moxios from 'moxios';
import request from 'supertest';
import Keygrip from 'keygrip';
import PermissionService from '../../src/services/permissions/permission';
import { Resource } from '../../src/interfaces';

const findAccountsByIdsMock = jest.fn();
const getAllowedAccountsByUserMock = jest.fn();
const getAccountPermissionForUserMock = jest.fn();
const getUserInDbForAccountMock = jest.fn();

// -------------- MOCK PERMISSIONS -------------- //

// 1. mock functions we use on the accountMiddleware:
//    findAccountById, findUserWithRoleByProviderInternalId, checkIfUserCanAccessAccountId
// 2. mock functions we use on the permissionsMiddleware:
//    getAllowedRepositoriesByUserOnAccount, getAllAccountsRepositoryIds
// 3. finally, mock the permission service implementation (in this case only mocking enforce is enough)
jest.mock('../../src/helpers/core-api/accounts', () => ({
  ...jest.requireActual('../../src/helpers/core-api/accounts'),
  findAccountById: jest.fn(() => ({ idAccount: 1, installationId: 1, login: 'nickname' })),
  // this is extra for this specific test
  findAccountsByIds: findAccountsByIdsMock
}));
jest.mock('../../src/helpers/core-api/users', () => ({
  ...jest.requireActual('../../src/helpers/core-api/users'),
  findUserWithRoleByProviderInternalId: jest.fn(() => ({ idUser: 1 }))
}));
jest.mock('../../src/helpers/acl', () => ({
  ...jest.requireActual('../../src/helpers/acl'),
  checkIfUserCanAccessAccountId: jest.fn(),
  getAllowedRepositoriesByUserOnAccount: jest.fn(() => ({})),
  // this is extra for this specific test
  getAllowedAccountsByUser: getAllowedAccountsByUserMock
}));
jest.mock('../../src/helpers/repository', () => ({
  ...jest.requireActual('../../src/helpers/repository'),
  getAllAccountsRepositoryIds: jest.fn(),
  getAllowedRepositoryIdsGroupedByTeamRole: jest.fn()
}));
jest.mock('../../src/services/permissions/permission', () => {
  return jest.fn().mockImplementation(() => ({
    enforce: jest.fn()
  }));
});
// -------------- MOCK PERMISSIONS -------------- //

jest.mock('../../src/helpers/permissions', () => ({
  ...jest.requireActual('../../src/helpers/permissions'),
  getAccountPermissionForUser: getAccountPermissionForUserMock
}));

jest.mock('../../src/helpers/user', () => ({
  ...jest.requireActual('../../src/helpers/user'),
  getUserInDbForAccount: getUserInDbForAccountMock
}));

jest.mock('../../src/helpers/user', () => ({
  ...jest.requireActual('../../src/helpers/user'),
  getUserInDbForAccount: getUserInDbForAccountMock
}));

jest.mock('minio', () => ({
  ...jest.requireActual('minio'),
  Client: jest.fn().mockImplementation(() => ({ setRequestOptions: jest.fn() }))
}));

describe('Accounts route', () => {
  let app;
  let cookie;
  let cookieHash;
  beforeAll(async () => {
    process.env = Object.assign(process.env, {
      GUARDRAILS_SAU_SECRET_KEY: '',
      GUARDRAILS_SAU_PRIVATE_KEY_BASE64: '',
      GUARDRAILS_JWT_TOKEN_SECRET: 'jwt-private',
      GUARDRAILS_GIT_TOKENS_SECRET: '12345678901234567890123456789012',
      GUARDRAILS_SESSION_KEY_1: 'session-key-1',
      GUARDRAILS_SESSION_KEY_2: 'session-key-2',
      GITHUB_APP_ISSUER_ID: '1',
      GUARDRAILS_CLI_TOKEN_SECRET: 'cli_secret',
      SENTRY_DSN: '',
      ENVIRONMENT: 'testing',
      ES_URI: 'http://localhost:9200',
      CORE_API_URI: 'http://core-api',
      CACHE_PROVIDER: ''
    });

    // eslint-disable-next-line global-require
    app = require('../../src/app');
    // eslint-disable-next-line global-require
    const auth = require('../../src/auth/auth');
    const expiresAt = 7200 * 1000 + new Date().getTime();
    const jwt = auth.generateJWT(
      [{ provider: 'github', username: 'nickname', access_token: 'token' }],
      expiresAt
    );
    cookie = Buffer.from(JSON.stringify({ jwt })).toString('base64');
    const kg = Keygrip(['session-key-1', 'session-key-2']);
    cookieHash = kg.sign(`gr.auth.token=${cookie}`);

    PermissionService.factory = jest.fn(() => new PermissionService({}));
  });

  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  describe('GET /v2/accounts', () => {
    it('should return accounts that have access to', async () => {
      getAllowedAccountsByUserMock.mockReturnValueOnce({
        allowedAccounts: {
          1: {
            login: 'user',
            provider: 'GITHUB',
            allowedRepositories: [],
            avatar_url: 'test_avatar_url',
            url: 'test_url'
          }
        },
        isSynchronizing: false
      });
      findAccountsByIdsMock.mockReturnValue([
        { idAccount: 1, installationId: 1, login: 'nickname' },
        { idAccount: 2, installationId: 2, login: 'nickname2' }
      ]);
      getAccountPermissionForUserMock.mockReturnValueOnce({
        read: [],
        write: [Resource.ACCOUNTS, Resource.CUSTOM_CONFIG, Resource.SAML, Resource.USERS]
      });

      getUserInDbForAccountMock.mockReturnValueOnce({
        idUser: 1
      });

      getUserInDbForAccountMock.mockReturnValueOnce({
        idUser: 1
      });

      const { body } = await request(app)
        .get('/v2/accounts')
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual({
        github: [
          {
            idAccount: 1,
            login: 'nickname',
            installationId: 1,
            avatar_url: 'test_avatar_url',
            url: 'test_url',
            hasAccessTo: {
              read: [],
              write: [Resource.ACCOUNTS, Resource.CUSTOM_CONFIG, Resource.SAML, Resource.USERS]
            },
            user: {
              idUser: 1
            }
          }
        ]
      });
    });
  });

  describe('PATCH /v2/accounts/configuration', () => {
    it('should raise error of missing accountId', async () => {
      const { body } = await request(app)
        .patch('/v2/accounts/configuration')
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual(
        expect.objectContaining({
          message: 'Missing mandatory accountId query parameter',
          error: 'Bad Request',
          statusCode: 400
        })
      );
    });

    it('should raise ValidationException error', async () => {
      const { body } = await request(app)
        .patch('/v2/accounts/configuration?accountId=1')
        .send({
          configuration:
            '"bundles: \\n  - haskell\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        })
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual(
        expect.objectContaining({
          details: expect.any(Array),
          message: "Some fields didn't pass validation",
          error: 'Bad Request',
          statusCode: 400
        })
      );
    });

    it('should raise SyntaxError error', async () => {
      const { body } = await request(app)
        .patch('/v2/accounts/configuration?accountId=1')
        .send({
          configuration:
            'bundles: \\n  - haskell\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        })
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: 'Unprocessable Entity',
          statusCode: 422
        })
      );
    });

    it('should raise YAMLException error', async () => {
      const { body } = await request(app)
        .patch('/v2/accounts/configuration?accountId=1')
        .send({ configuration: '"bundles: \\n  : haskell\\n"' })
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          error: 'Unprocessable Entity',
          statusCode: 422
        })
      );
    });

    it.skip('should update installation', async () => {
      moxios.stubRequest('https://api.github.com/user/installations', {
        statusCode: 200,
        response: {
          installations: [
            {
              account: {
                login: 'nickname'
              }
            }
          ]
        }
      });

      moxios.stubRequest('http://core-api/graphql', {
        statusCode: 200,
        response: {
          data: {
            account: { id: 1, login: 'nickname', provider: 'github' }
          }
        }
      });

      moxios.stubRequest('http://core-api/graphql', {
        statusCode: 200,
        response: {
          data: {
            updateAccount: {
              account: { idAccount: 1, login: 'nickname', provider: 'github', configuration: {} }
            }
          }
        }
      });

      const { body } = await request(app)
        .patch('/v2/accounts/configuration?provider=github')
        .send({
          idAccount: 1,
          configuration:
            '"bundles: \\n  - javascript\\nreport:\\n  pullRequest: \\n    findings: \\"onAllFiles\\"\\n    comment: true\\nnotifications:\\n  slack:\\n    enabled: true\\n    webhookUrl: http://localhost\\n    notify: onAllScans\\n"'
        })
        .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);

      expect(body).toEqual(
        expect.objectContaining({
          configuration: expect.any(Object),
          login: expect.any(String)
        })
      );
    });
  });
});
