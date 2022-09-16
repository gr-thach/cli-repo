import { getAllowedAccountsByUser } from '../../src/helpers/acl';
import Cache from '../../src/services/cache';

jest.mock('../../src/helpers/core-api/accounts');
jest.mock('../../src/services/cache');
jest.mock('../../config', () => ({
  ...jest.requireActual('../../config'),
  env: {
    GITHUB_API_URL: 'https://api.github.com',
    GITLAB_URL: 'https://gitlab.com',
    BITBUCKET_DATA_CENTER_API_URL: 'https://bitbucket.example.com',
    BITBUCKET_DATA_CENTER_SITE_URL: 'https://bitbucket.example.com',
    BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY: 'consumer',
    // This is a random generated private key.
    BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET:
      'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBc2tlV2NUM3hQQTRHVDF5YklDSmR0bUhDVDZGd1RzMWNWbW9WUXRheTJQOUdzT1d6CnIybEhUcVl2UTAwdUd0aTlNU3pNWTlaazVmNEpQT1phQUI3WGpJY2pkcmRjZksraGk1bjJKMXFwa3hVK3NDUGIKc1BvWDBCUFJzWXByZGd4TnJYYWRLbCtlYkhRYUJsTUhTWWZ0cDNXNGl4N0NkTFN4dS9Db2tHVS9sVEdoUWwyTQpYODJ2alZOR2tJMlNyWEkzYmJzWXFKV1EyNDVVcWJwcXNGYjFrc25yTmpsdENCeElwSDlud3NVWUhqQWpnaEt0CmF6b1QwanpLT2hobHJIVURzM09LdUtSa0NlZmk0KzJ2VUVKRW5JdCtoTzc0ZkRQTG05SFh4dDE4RUM0S2dmSCsKWVlDTHgzeXJvdmhCK052RVZnaVJvZVFNaEg3Z1VzdWNpYnZ2bFFJREFRQUJBb0gvU29PaFhiT0dJSk84RDIrbApac2oyWWtSNThzNkhJbWl6TDJzbmQ4aEUrRzI2SGpYajVHMGNZTU1VL2d4RU9QUmVIeSthUGlCZUM4TWlHVkl1ClM5NllPU1JDcmx2MVRDZ2NYVHo4cFhZL2FqcDIrU2dEcXZUYy94dEppZXRRL3dZbGNWc2lWWk9obzdMakxjR0cKU2pXR0gzZ1VxaEV4TlpaUXN6empOM2NhSEVEdlFDU0l2RHBLY0puSm1DbHFhQ0U5TFJ4cVJJQ3NsMkNrd09ncgppb0lWdXphLzFZODQxaXAxYmtaazl0L1VxbEtVMHo2MEthbFJHc3ZkWDFnNDNZUXcrdXE3M29wb1FwbGM5YThSCml6eHZZSVVRZEIxQmhkMFFoMU90UnNPMVF3SG5iRm1ETlZ4SU1tVUNTSzh5NldGV0ZqRm9zTXpSVml5WFY4ZzgKS0pBbEFvR0JBT0tsZXBNOWhvT1lSWDcxQ1g0dC9QRi93Ym5zVzRGbjJqc0lUUGRKdnRkZHVPV0x5ZitWNjdFOQpMcnJDTnRMeHhqbjNZQWR5b1pYVnMyM09JMERrVjdTM2RYZlh0UXdjTVBxdXpRaDRxVEIzelZVYVZXR1JhdGlICndwK2V4OFJrMEJXaXMzZmN6dlhweDl6L0JiWUlSSGtPVVFsY296eG9hbEowNmxzR3UzY1BBb0dCQU1sZWZ3Q2EKZVZvMTZWa1ZwL0drYnZGMWdyaSswTzI3V3dQSXlJeWxrZFhiMUE4ZTdoakNtNHhuODhranpQZFNVOG9WNFR1NQpoRFJnd0haVjdJc29jT2xQZU1iVVVNWjJFcmxwcHBERHVwL1Y1Y2RpL3NVK1BNY1RIM20wTUJLRnhIQkF1eGNnCmd2UTd5ZGo2eitWdUFsMU5vTkJURzdWM0EvcXZoMW1VTzQ4YkFvR0JBSmVEMEtIR0s3cWxmVEFXVjdaR3dDWWkKSmp4SXloT0VmZHVnL1BNRUZkU2NEeE5GbEZDTXhQZkQwdzErOEcrc3VidmVxQS9Tamp0QWxhYitlNHJTRzkvdwpGVk44bk1mdndMNlZSUFE0MWNKVkZLdWo0eGhLd29ibW16RmlVR0gya3pVamc1N0p1b0dqTzcxOXJ5KzE3ekNPClpaWkFtOCt5YmdHWnIySVM2aGY1QW9HQkFLei9LTjdzMXhxZ1BGUFRYaEFrTTBmdnE1bHFIWFpQd25aeTFaQzMKWVoyNEdPdlFwNzdQMmZCN0VoNllTaXVrSitYeWZDamlUV2p1UWdxbjhPcndtR2hvWlJ0MEpkMEtiVFdyUlhVVApJazdVNVc0eFp5MHZOZW5WVFBJeTBpWG5sQWJZSmFOTnhCTnRGaEQ2RVFkTFJtN0FGVXRFU3diUU03UDNmckYvCnZ0ZEhBb0dBTy8vNWczWk1jV1lDN0FmOHFNdG1FV3RFY1UzZnc5RnpiSk14MG5TY0ljQzNzSWliekJLSGlLcjAKcUYvbVo3ektLR3FlTDJrSVBBREVjU0lQcWNpYnNtWUtIRWsybU1Icms3MGRSSGs2Z2FQZkJHSzRHeWFiSkVDbgpHTVBacnc1aXU4ZlVqb2xaaytxWk95dk00YmFzYmxMMVZOVU0yd0szZkVQZ0IrMkJEbHM9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t',
    CACHE_PROVIDER: ''
  }
}));

const allowedAccounts = {
  1: { login: 'user', provider: 'GITHUB', allowedRepositories: { read: [], admin: [] } }
};

describe('acl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    const mockGet = jest.fn();
    const mockGetInstance = jest.fn();
    mockGet.mockReturnValue(JSON.stringify(allowedAccounts));
    mockGetInstance.mockReturnValue({ get: mockGet });
    Cache.prototype.getInstance = mockGetInstance;
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getAllowedAccountsByUser', () => {
    it('should return allowedAccounts object and isSynchronizing = false', async () => {
      const user = { provider: 'github', githubNickname: 'test' };

      const result = await getAllowedAccountsByUser(user);

      expect(result).toStrictEqual({
        allowedAccounts,
        isSynchronizing: false
      });
    });
  });
});
