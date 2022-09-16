import SyncService from '../../src/services/sync';
import { getGitlabAcccountsAndRepos, syncGitlabAccounts } from '../../src/helpers/gitlab';
import { getBitbucketAcccountsAndRepos } from '../../src/helpers/bitbucket';
import { getGithubAcccountsAndRepos, syncGithubAccounts } from '../../src/helpers/github';
import {
  getBitbucketDataCenterAcccountsAndRepos,
  syncBitbucketDataCenterAccounts,
  syncDefaultBranches
} from '../../src/helpers/bitbucketDataCenter';
import { findUserWithRoleByProviderInternalId } from '../../src/helpers/core-api/users';
import { findAllRoles } from '../../src/helpers/core-api/roles';
import GitHubService from '../../src/services/git/github';
import GitLabService from '../../src/services/git/gitlab';
import BitbucketService from '../../src/services/git/bitbucket';
import BitbucketDataCenterService from '../../src/services/git/bitbucketDataCenter';

const {
  createRepositories,
  updateRepositories
} = require('../../src/helpers/core-api/repositories');

jest.mock('../../src/helpers/core-api/repositories');
jest.mock('../../src/helpers/github');
jest.mock('../../src/helpers/gitlab');
jest.mock('../../src/helpers/bitbucket');
jest.mock('../../src/helpers/bitbucketDataCenter');
jest.mock('../../src/helpers/core-api/accounts');
jest.mock('../../src/helpers/core-api/users');
jest.mock('../../src/helpers/core-api/roles');

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(GitHubService.prototype, 'getRepositories').mockImplementation(() => {});
    jest.spyOn(GitHubService.prototype, 'getUserRole').mockImplementation(() => 'developer');

    jest.spyOn(GitLabService.prototype, 'getRepositories').mockImplementation(() => {});
    jest.spyOn(GitLabService.prototype, 'getUserRole').mockImplementation(() => 'developer');

    jest.spyOn(BitbucketService.prototype, 'getRepositories').mockImplementation(() => {});
    jest.spyOn(BitbucketService.prototype, 'getUserRole').mockImplementation(() => 'developer');
    jest.spyOn(BitbucketService.prototype, 'getWorkspaces').mockImplementation(() => []);

    jest
      .spyOn(BitbucketDataCenterService.prototype, 'getRepositories')
      .mockImplementation(() => {});
    jest
      .spyOn(BitbucketDataCenterService.prototype, 'getUserRole')
      .mockImplementation(() => 'developer');

    findAllRoles.mockReturnValue([
      { idRole: 1, name: 'developer' },
      { idRole: 2, name: 'admin' }
    ]);
    findUserWithRoleByProviderInternalId.mockReturnValue({
      idUser: 1,
      providerInternalId: '123',
      role: {
        idRole: 1
      }
    });
  });

  describe('synchronize', () => {
    it('should raise error', async () => {
      expect.assertions(1);

      const user = {
        provider: 'nonGithub',
        accessToken: 'token'
      };

      try {
        const syncService = new SyncService(user);
        await syncService.synchronize();
      } catch (err) {
        expect(err.message).toBe('Invalid user provider');
      }
    });

    it('should return proper sync result for github', async () => {
      const user = {
        provider: 'github',
        accessToken: 'token'
      };

      const installations = [{ id: 1, account: { login: 'login' } }];
      syncGithubAccounts.mockReturnValueOnce(installations);

      getGithubAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 1,
            login: 'someGHAcc',
            provider: 'GITHUB',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 1, providerInternalId: '1001' },
              { idRepository: 2, providerInternalId: '1002' }
            ]
          },
          [{ id: 1002 }],
          installations[0]
        ]
      ]);

      const syncService = new SyncService(user);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '1': {
          allowedRepositories: { read: [2], admin: [] },
          idAccount: 1,
          login: 'someGHAcc',
          provider: 'GITHUB'
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(0);
    });

    it('should filter github repos by filterReposByWriteAccess', async () => {
      const user = {
        provider: 'github',
        accessToken: 'token'
      };

      const installations = [{ id: 1, account: { login: 'login' } }];
      syncGithubAccounts.mockReturnValueOnce(installations);

      getGithubAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 1,
            login: 'someGHAcc',
            provider: 'GITHUB',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 1, providerInternalId: '1001' },
              { idRepository: 2, providerInternalId: '1002' }
            ]
          },
          [
            { id: 1001, permissions: { push: true } },
            { id: 1002, permissions: { push: false } }
          ],
          installations[0]
        ]
      ]);

      const syncService = new SyncService(user, true);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '1': {
          allowedRepositories: { read: [1], admin: [] },
          idAccount: 1,
          login: 'someGHAcc',
          provider: 'GITHUB'
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(0);
    });

    it('should return proper sync result for gitlab', async () => {
      const user = {
        provider: 'gitlab',
        accessToken: 'token'
      };

      const groups = [{ avatar_url: 'https://test_url', web_url: 'test_url' }];
      syncGitlabAccounts.mockReturnValueOnce({ groups, gitlabUser: {} });
      getGitlabAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 10,
            login: 'someGLAcc',
            provider: 'GITLAB',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 10, providerInternalId: '2001' },
              { idRepository: 20, providerInternalId: '2002' }
            ]
          },
          [{ id: 2001 }, { id: 2002 }],
          groups[0]
        ]
      ]);

      createRepositories.mockResolvedValueOnce([]);

      const syncService = new SyncService(user);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '10': {
          allowedRepositories: { read: [10, 20], admin: [] },
          idAccount: 10,
          login: 'someGLAcc',
          provider: 'GITLAB',
          avatar_url: 'https://test_url',
          url: 'test_url'
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(0);
    });

    it('should filter github repos by filterReposByWriteAccess', async () => {
      const user = {
        provider: 'gitlab',
        accessToken: 'token'
      };

      const groups = [{ avatar_url: 'https://test_url', web_url: 'test_url' }];
      syncGitlabAccounts.mockReturnValueOnce({ groups, gitlabUser: {} });
      getGitlabAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 10,
            login: 'someGLAcc',
            provider: 'GITLAB',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 10, providerInternalId: '2001' },
              { idRepository: 20, providerInternalId: '2002' }
            ]
          },
          [
            { id: 2001, permissions: { project_access: { access_level: 30 } } },
            { id: 2002, permissions: { project_access: { access_level: 0 } } }
          ],
          groups[0]
        ]
      ]);

      createRepositories.mockResolvedValueOnce([]);

      const syncService = new SyncService(user, true);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '10': {
          allowedRepositories: { read: [10], admin: [] },
          idAccount: 10,
          login: 'someGLAcc',
          provider: 'GITLAB',
          avatar_url: 'https://test_url',
          url: 'test_url'
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(0);
    });

    it('should return proper sync result for bitbucket', async () => {
      const user = {
        provider: 'bitbucket',
        accessToken: 'token'
      };

      getBitbucketAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 100,
            login: 'someBBAcc',
            provider: 'BITBUCKET',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 100, providerInternalId: '3001' },
              { idRepository: 200, providerInternalId: '3002' }
            ]
          },
          [{ id: 3001 }, { id: 3002 }],
          {
            links: {
              avatar: {
                href: 'test_avatar_url'
              },
              html: {
                href: 'test_url'
              }
            }
          }
        ]
      ]);

      const syncService = new SyncService(user, true);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '100': {
          allowedRepositories: { read: [100, 200], admin: [] },
          idAccount: 100,
          login: 'someBBAcc',
          provider: 'BITBUCKET',
          avatar_url: 'test_avatar_url',
          url: 'test_url'
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(0);
    });

    it('should return proper sync result for bitbucket data center', async () => {
      const user = {
        provider: 'bitbucket_data_center',
        accessToken: 'token'
      };

      createRepositories.mockResolvedValueOnce([]);
      syncBitbucketDataCenterAccounts.mockReturnValueOnce({ projects: [], personalProject: {} });
      getBitbucketDataCenterAcccountsAndRepos.mockReturnValueOnce([
        [
          {
            idAccount: 1000,
            login: 'someBBDCAcc',
            provider: 'BITBUCKET_DATA_CENTER',
            subscription: { plan: { code: 'FREE' } },
            repositories: [
              { idRepository: 1000, providerInternalId: '4001' },
              { idRepository: 2000, providerInternalId: '4002' }
            ]
          },
          [{ id: 4001 }, { id: 4002 }]
        ]
      ]);

      const syncService = new SyncService(user, true);
      const result = await syncService.synchronize();

      expect(result).toEqual({
        '1000': {
          allowedRepositories: { read: [1000, 2000], admin: [] },
          idAccount: 1000,
          login: 'someBBDCAcc',
          provider: 'BITBUCKET_DATA_CENTER',
          avatar_url: '',
          url: ''
        }
      });
      expect(createRepositories).toHaveBeenCalledTimes(1);
      expect(updateRepositories).toHaveBeenCalledTimes(1);
      expect(syncDefaultBranches).toHaveBeenCalledTimes(1);
    });
  });
});
