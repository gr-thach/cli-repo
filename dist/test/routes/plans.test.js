"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const keygrip_1 = __importDefault(require("keygrip"));
const permission_1 = __importDefault(require("../../src/services/permissions/permission"));
// -------------- MOCK PERMISSIONS -------------- //
// 1. mock functions we use on the accountMiddleware:
//    findAccountById, findUserWithRoleByProviderInternalId, checkIfUserCanAccessAccountId
// 2. mock functions we use on the permissionsMiddleware:
//    getAllowedRepositoriesByUserOnAccount, getAllAccountsRepositoryIds
// 3. finally, mock the permission service implementation (in this case only mocking enforce is enough)
jest.mock('../../src/helpers/core-api/accounts', () => ({
    ...jest.requireActual('../../src/helpers/core-api/accounts'),
    findAccountById: jest.fn(() => ({ idAccount: 1, installationId: 1, login: 'nickname' }))
}));
jest.mock('../../src/helpers/core-api/users', () => ({
    ...jest.requireActual('../../src/helpers/core-api/users'),
    findUserWithRoleByProviderInternalId: jest.fn(() => ({ idUser: 1 }))
}));
jest.mock('../../src/helpers/acl', () => ({
    ...jest.requireActual('../../src/helpers/acl'),
    checkIfUserCanAccessAccountId: jest.fn(),
    getAllowedRepositoriesByUserOnAccount: jest.fn(() => ({}))
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
jest.mock('minio', () => ({
    ...jest.requireActual('minio'),
    Client: jest.fn().mockImplementation(() => ({ setRequestOptions: jest.fn() }))
}));
// -------------- MOCK PERMISSIONS -------------- //
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => {
        return {
            plans: {
                list: () => ({ data: [] })
            },
            prices: {
                list: () => ({ data: [] })
            }
        };
    });
});
describe('Plans route', () => {
    let app;
    let cookie;
    let cookieHash;
    let findAllPlansSpy;
    beforeAll(async () => {
        process.env = Object.assign(process.env, {
            GUARDRAILS_SAU_SECRET_KEY: '',
            GUARDRAILS_SAU_PRIVATE_KEY_BASE64: '',
            GUARDRAILS_JWT_TOKEN_SECRET: 'jwt-private',
            GUARDRAILS_SESSION_KEY_1: 'session-key-1',
            GUARDRAILS_SESSION_KEY_2: 'session-key-2',
            GITHUB_APP_ISSUER_ID: '1',
            COUCHDB_URL: 'https://admin:test@example.com:6984',
            GUARDRAILS_CLI_TOKEN_SECRET: 'cli_secret',
            SENTRY_DSN: '',
            ENVIRONMENT: 'testing',
            ES_URI: 'http://localhost:9200',
            STRIPE_SECRET_KEY: 'asd'
        });
        // eslint-disable-next-line global-require
        const plansCore = require('../../src/helpers/core-api/plans');
        findAllPlansSpy = jest.spyOn(plansCore, 'findAllPlans');
        // eslint-disable-next-line global-require
        app = require('../../src/app');
        // eslint-disable-next-line global-require
        const auth = require('../../src/auth/auth');
        const expiresAt = 7200 * 1000 + new Date().getTime();
        const jwt = auth.generateJWT([{ provider: 'github', githubNickname: 'nickname', githubAccessToken: 'token' }], expiresAt);
        cookie = Buffer.from(JSON.stringify({ jwt })).toString('base64');
        const kg = (0, keygrip_1.default)(['session-key-1', 'session-key-2']);
        cookieHash = kg.sign(`gr.auth.token=${cookie}`);
        permission_1.default.factory = jest.fn(() => new permission_1.default({}));
    });
    afterEach(() => {
        findAllPlansSpy.mockRestore();
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
    it('should return plans', async () => {
        const plan = {
            idPlan: 1,
            code: 'FREE',
            name: 'Free',
            description: 'Free plan description',
            bullets: ['Feature 1', 'Feature 2'],
            queuePriority: 4,
            createdAt: '2019-03-26T02:51:00.855Z',
            updatedAt: '2019-06-07T08:24:21.664Z'
        };
        findAllPlansSpy.mockImplementation(() => [plan]);
        const { body } = await (0, supertest_1.default)(app)
            .get('/v2/plans?accountId=1')
            .set('Cookie', [`gr.auth.token=${cookie};gr.auth.token.sig=${cookieHash}`]);
        expect(body).toEqual([
            {
                price: {
                    minUnits: 1,
                    monthlyPriceBase: 0,
                    monthlyPricePerUnit: 0,
                    yearlyPriceBase: 0,
                    yearlyPricePerUnit: 0
                },
                ...plan
            }
        ]);
    });
});
//# sourceMappingURL=plans.test.js.map