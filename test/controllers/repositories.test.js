import { find, list } from '../../src/controllers/repositories';
import { queryRepositoriesByIds, getRepositoryById } from '../../src/helpers/core-api/repositories';
import PermissionService from '../../src/services/permissions/permission';

jest.mock('../../src/helpers/core-api/repositories');

const getAllowedIdsMock = jest.fn();
jest.mock('../../src/services/permissions/permission', () => {
  return jest.fn().mockImplementation(() => ({
    getAllowedIds: getAllowedIdsMock,
    repositoriesEnforce: getAllowedIdsMock
  }));
});
const permissionMock = new PermissionService();

describe('repositories controller', () => {
  const send = jest.fn();
  let res;

  const repository = {
    idRepository: 1,
    fkAccount: 1,
    name: 'Gibson.Schuyler',
    provider: 'GITHUB',
    providerInternalId: '543',
    badgeToken: '83b83f4e4cbc5a3e9e42cc69472822a9d0c11e16',
    isPrivate: true,
    isEnabled: true,
    defaultBranch: 'master',
    configuration: {},
    createdAt: new Date('2019-12-11T03:21:48.289Z').toJSON(),
    updatedAt: new Date('2019-12-12T03:21:48.289Z').toJSON()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    res = {
      status: jest.fn(() => {
        return {
          send
        };
      })
    };

    PermissionService.factory = jest.fn(() => new PermissionService({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('list', () => {
    it('should return repositories', async () => {
      const req = {
        query: { accountId: '1' },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([1]).mockReturnValueOnce([1]);

      queryRepositoriesByIds.mockReturnValue({ repositories: [repository], totalCount: 1 });

      await list(req, res);

      expect(send).toBeCalledWith({
        repositories: [{ ...repository, write: true }],
        totalCount: 1
      });
      expect(queryRepositoriesByIds).toHaveBeenCalledTimes(1);
      expect(queryRepositoriesByIds).toHaveBeenCalledWith([1], {
        teamId: undefined,
        orderBy: 'updatedAt,desc',
        limit: undefined,
        offset: undefined,
        dependency: undefined,
        license: undefined,
        pkgLanguage: undefined,
        name: undefined,
        isPrivate: undefined,
        language: undefined,
        isEnabled: undefined
      });
    });

    it('should return repositories and apply proper filters and parameters', async () => {
      const req = {
        query: {
          accountId: '1',
          limit: 16,
          offset: 0,
          orderBy: 'updatedAt,asc',
          teamId: 10,
          search: 'test',
          isPrivate: 't',
          language: 'go,HTML,JavaScript',
          isEnabled: 'f'
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([1]).mockReturnValueOnce([1]);

      queryRepositoriesByIds.mockReturnValue({ repositories: [repository], totalCount: 1 });

      await list(req, res);

      expect(send).toBeCalledWith({
        repositories: [{ ...repository, write: true }],
        totalCount: 1
      });
      expect(queryRepositoriesByIds).toHaveBeenCalledTimes(1);
      expect(queryRepositoriesByIds).toHaveBeenCalledWith([1], {
        teamId: 10,
        orderBy: 'updatedAt,asc',
        limit: 16,
        offset: 0,
        dependency: undefined,
        license: undefined,
        pkgLanguage: undefined,
        name: 'test',
        isPrivate: 't',
        language: ['go', 'HTML', 'JavaScript'],
        isEnabled: 'f'
      });
    });
  });

  describe('find', () => {
    it('should return repository with id 1', async () => {
      const req = {
        params: { repoId: '1' },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([]).mockReturnValueOnce([]);

      getRepositoryById.mockImplementation(() => repository);

      await find(req, res);

      expect(send).toBeCalledWith({ ...repository, write: false });
    });
  });
});
