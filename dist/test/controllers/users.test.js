"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../../src/controllers/user");
const users_1 = require("../../src/helpers/core-api/users");
jest.mock('../../src/helpers/core-api/users');
jest.mock('../../src/helpers/acl');
jest.mock('../../config', () => ({
    ...jest.requireActual('../../config'),
    env: {
        GITHUB_API_URL: 'https://api.github.com',
        GITLAB_URL: 'https://gitlab.com',
        BITBUCKET_DATA_CENTER_API_URL: 'https://bitbucket.example.com',
        BITBUCKET_DATA_CENTER_SITE_URL: 'https://bitbucket.example.com',
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY: 'consumer',
        // This is a random generated private key.
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBc2tlV2NUM3hQQTRHVDF5YklDSmR0bUhDVDZGd1RzMWNWbW9WUXRheTJQOUdzT1d6CnIybEhUcVl2UTAwdUd0aTlNU3pNWTlaazVmNEpQT1phQUI3WGpJY2pkcmRjZksraGk1bjJKMXFwa3hVK3NDUGIKc1BvWDBCUFJzWXByZGd4TnJYYWRLbCtlYkhRYUJsTUhTWWZ0cDNXNGl4N0NkTFN4dS9Db2tHVS9sVEdoUWwyTQpYODJ2alZOR2tJMlNyWEkzYmJzWXFKV1EyNDVVcWJwcXNGYjFrc25yTmpsdENCeElwSDlud3NVWUhqQWpnaEt0CmF6b1QwanpLT2hobHJIVURzM09LdUtSa0NlZmk0KzJ2VUVKRW5JdCtoTzc0ZkRQTG05SFh4dDE4RUM0S2dmSCsKWVlDTHgzeXJvdmhCK052RVZnaVJvZVFNaEg3Z1VzdWNpYnZ2bFFJREFRQUJBb0gvU29PaFhiT0dJSk84RDIrbApac2oyWWtSNThzNkhJbWl6TDJzbmQ4aEUrRzI2SGpYajVHMGNZTU1VL2d4RU9QUmVIeSthUGlCZUM4TWlHVkl1ClM5NllPU1JDcmx2MVRDZ2NYVHo4cFhZL2FqcDIrU2dEcXZUYy94dEppZXRRL3dZbGNWc2lWWk9obzdMakxjR0cKU2pXR0gzZ1VxaEV4TlpaUXN6empOM2NhSEVEdlFDU0l2RHBLY0puSm1DbHFhQ0U5TFJ4cVJJQ3NsMkNrd09ncgppb0lWdXphLzFZODQxaXAxYmtaazl0L1VxbEtVMHo2MEthbFJHc3ZkWDFnNDNZUXcrdXE3M29wb1FwbGM5YThSCml6eHZZSVVRZEIxQmhkMFFoMU90UnNPMVF3SG5iRm1ETlZ4SU1tVUNTSzh5NldGV0ZqRm9zTXpSVml5WFY4ZzgKS0pBbEFvR0JBT0tsZXBNOWhvT1lSWDcxQ1g0dC9QRi93Ym5zVzRGbjJqc0lUUGRKdnRkZHVPV0x5ZitWNjdFOQpMcnJDTnRMeHhqbjNZQWR5b1pYVnMyM09JMERrVjdTM2RYZlh0UXdjTVBxdXpRaDRxVEIzelZVYVZXR1JhdGlICndwK2V4OFJrMEJXaXMzZmN6dlhweDl6L0JiWUlSSGtPVVFsY296eG9hbEowNmxzR3UzY1BBb0dCQU1sZWZ3Q2EKZVZvMTZWa1ZwL0drYnZGMWdyaSswTzI3V3dQSXlJeWxrZFhiMUE4ZTdoakNtNHhuODhranpQZFNVOG9WNFR1NQpoRFJnd0haVjdJc29jT2xQZU1iVVVNWjJFcmxwcHBERHVwL1Y1Y2RpL3NVK1BNY1RIM20wTUJLRnhIQkF1eGNnCmd2UTd5ZGo2eitWdUFsMU5vTkJURzdWM0EvcXZoMW1VTzQ4YkFvR0JBSmVEMEtIR0s3cWxmVEFXVjdaR3dDWWkKSmp4SXloT0VmZHVnL1BNRUZkU2NEeE5GbEZDTXhQZkQwdzErOEcrc3VidmVxQS9Tamp0QWxhYitlNHJTRzkvdwpGVk44bk1mdndMNlZSUFE0MWNKVkZLdWo0eGhLd29ibW16RmlVR0gya3pVamc1N0p1b0dqTzcxOXJ5KzE3ekNPClpaWkFtOCt5YmdHWnIySVM2aGY1QW9HQkFLei9LTjdzMXhxZ1BGUFRYaEFrTTBmdnE1bHFIWFpQd25aeTFaQzMKWVoyNEdPdlFwNzdQMmZCN0VoNllTaXVrSitYeWZDamlUV2p1UWdxbjhPcndtR2hvWlJ0MEpkMEtiVFdyUlhVVApJazdVNVc0eFp5MHZOZW5WVFBJeTBpWG5sQWJZSmFOTnhCTnRGaEQ2RVFkTFJtN0FGVXRFU3diUU03UDNmckYvCnZ0ZEhBb0dBTy8vNWczWk1jV1lDN0FmOHFNdG1FV3RFY1UzZnc5RnpiSk14MG5TY0ljQzNzSWliekJLSGlLcjAKcUYvbVo3ektLR3FlTDJrSVBBREVjU0lQcWNpYnNtWUtIRWsybU1Icms3MGRSSGs2Z2FQZkJHSzRHeWFiSkVDbgpHTVBacnc1aXU4ZlVqb2xaaytxWk95dk00YmFzYmxMMVZOVU0yd0szZkVQZ0IrMkJEbHM9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t'
    }
}));
describe('Users controller', () => {
    const send = jest.fn();
    const status = jest.fn();
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        res = {
            status: jest.fn(() => {
                return {
                    status,
                    send
                };
            })
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    describe('list users', () => {
        it('Should return users.', async () => {
            const req = { query: { limit: 0, offset: 16 }, account: { idAccount: 1 } };
            const users = [
                {
                    idUser: 'f28c7fca-a284-4167-88eb-94a064e72761',
                    apiKey: null,
                    createdAt: '2020-06-10 17:33:35.522+00',
                    updatedAt: '2021-11-01 13:18:32.836+00',
                    deletedAt: null,
                    login: 'test1',
                    provider: 'gitlab',
                    providerAccessToken: null,
                    providerRefreshToken: null,
                    providerInternalId: 1234567,
                    name: 'Yamil',
                    avatarUrl: 'https://gitlab.com/uploads/-/system/user/avatar/1234567/avatar.png',
                    email: 'test@email1.com',
                    providerAccessTokenSecret: null,
                    providerMetadata: null,
                    acl: '{"189":{"idAccount":189,"login":"yamiljf","provider":"GITLAB","allowedRepositories":{"read":[],"admin":[773,774]},"avatar_url":"https://gitlab.com/uploads/-/system/user/avatar/567381/avatar.png","url":"https://gitlab.com/yamiljf"},"203":{"idAccount":203,"login":"yam-org","provider":"GITLAB","allowedRepositories":{"read":[799,798],"admin":[]},"avatar_url":"","url":"https://gitlab.com/groups/yam-org"}}',
                    lastLoginAt: '2021-11-01 13:18:32.836+00'
                },
                {
                    idUser: '03e5020a-76d4-49cc-9f47-33099ac6e888',
                    apiKey: null,
                    createdAt: '2020-06-29 10:18:51.448+00',
                    updatedAt: '2021-08-22 17:20:02.959+00',
                    deletedAt: null,
                    login: 'test2',
                    provider: 'gitlab',
                    providerAccessToken: null,
                    providerRefreshToken: null,
                    providerInternalId: 7654321,
                    name: 'GuardRails',
                    avatarUrl: 'https://secure.gravatar.com/avatar/hg1234frf2uryhsad?s=80&d=identicon',
                    email: 'test@email2.com',
                    providerAccessTokenSecret: null,
                    providerMetadata: null,
                    acl: null,
                    lastLoginAt: '2021-08-22 17:20:02.959+00'
                }
            ];
            users_1.queryUsers.mockReturnValueOnce({ users, totalCount: 2 });
            await (0, user_1.list)(req, res);
            expect(send).toBeCalledWith({ users, totalCount: 2 });
            expect(users_1.queryUsers).toBeCalledWith(1, { teamId: undefined, search: undefined, role: undefined }, 0, 16);
        });
    });
});
//# sourceMappingURL=users.test.js.map