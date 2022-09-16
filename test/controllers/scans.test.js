import moxios from 'moxios';
import { filters } from '../../src/controllers/scans';
import { queryScansFilters } from '../../src/helpers/core-api/scans';

jest.mock('../../src/helpers/core-api/scans');

// -------------- MOCK PERMISSIONS (controllers) -------------- //
const getAllowedIdsMock = jest.fn();
const PermissionMockClass = jest.fn().mockImplementation(() => {
  return {
    getAllowedIds: getAllowedIdsMock,
    repositoriesEnforce: getAllowedIdsMock
  };
});
const permissionMock = new PermissionMockClass();
// -------------- MOCK PERMISSIONS -------------- //

describe('Scans controller', () => {
  const send = jest.fn();
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    moxios.install();

    res = {
      status: jest.fn(() => {
        return {
          send
        };
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    moxios.uninstall();
  });

  describe('Scans filters', () => {
    it('Should return scan filters', async () => {
      const req = {
        query: {
          accountId: 1000,
          repositoryIds: '1,2',
          branch: 'master',
          sha: undefined
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([1, 2]);

      const scanFilters = [
        {
          type: ['BRANCH', 'PULL'],
          sha: ['testSha123', 'testSha456', 'testSha789'],
          sender: ['dev1', 'dev2']
        }
      ];

      queryScansFilters.mockReturnValueOnce(scanFilters);

      await filters(req, res);

      expect(send).toBeCalledWith(scanFilters);

      expect(queryScansFilters).toBeCalledWith({
        repositoryIds: [1, 2],
        branch: req.query.branch,
        filters: {
          search: req.query.search,
          sha: req.query.sha ? req.query.sha.split(',') : undefined,
          hasVulnerabilities: req.query.hasVulnerabilities,
          type: req.query.type ? req.query.type.split(',') : undefined,
          sender: req.query.sender ? req.query.sender.split(',') : undefined
        }
      });
    });

    it("Should return empty array when no repositoryIds come from the user's permissions", async () => {
      const req = {
        query: {
          accountId: 1000,
          repositoryIds: '1,2',
          branch: 'master',
          sha: undefined
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([]);

      await filters(req, res);

      expect(send).toBeCalledWith({
        type: [],
        sha: [],
        sender: []
      });
    });
  });
});
