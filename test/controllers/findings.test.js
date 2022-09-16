import moxios from 'moxios';
import { parseStatusQueryParam } from '../../src/helpers/findings';
import { filters } from '../../src/controllers/findings';
import { queryFindingsFilters } from '../../src/helpers/core-api/findings';

jest.mock('../../src/helpers/core-api/findings');
// jest.mock('../../src/helpers/acl');

// -------------- MOCK PERMISSIONS (controllers) -------------- //
const getAllowedIdsMock = jest.fn();
const PermissionMockClass = jest.fn().mockImplementation(() => {
  return {
    enforce: jest.fn().mockReturnThis(),
    getAllowedIds: getAllowedIdsMock,
    repositoriesEnforce: getAllowedIdsMock
  };
});
const permissionMock = new PermissionMockClass();
// -------------- MOCK PERMISSIONS -------------- //

describe('Findings controller', () => {
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

  describe('Findings filters', () => {
    it('Should return finding filters', async () => {
      const req = {
        query: {
          accountId: 1000,
          repositoryIds: '1,2',
          branchName: 'master',
          scanId: undefined,
          status: 'VULNERABILITY,MARK_AS_FIXED',
          isParanoid: undefined
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([1, 2]);

      const findingFilters = {
        engineRule: [],
        rule: [],
        status: [],
        language: [],
        severity: [],
        type: [],
        introducedBy: [],
        path: []
      };

      queryFindingsFilters.mockReturnValueOnce(findingFilters);

      await filters(req, res);

      expect(send).toBeCalledWith(findingFilters);

      const status = parseStatusQueryParam(req.query.status);

      expect(queryFindingsFilters).toBeCalledWith({
        repositoryIds: [1, 2],
        branchName: req.query.branchName,
        scanId: req.query.scanId,
        isParanoid: req.query.isParanoid,
        filters: {
          rule: req.query.rule ? req.query.rule.split(',') : undefined,
          engineRule: req.query.engineRule ? req.query.engineRule.split(',') : undefined,
          language: req.query.language ? req.query.language.split(',') : undefined,
          status,
          type: req.query.type ? req.query.type.split(',') : undefined,
          introducedBy: req.query.introducedBy ? req.query.introducedBy.split(',') : undefined,
          path: req.query.path ? req.query.path.split(',') : undefined
        }
      });
    });

    it("Should return empty array when no repositoryIds come from the user's permissions", async () => {
      const req = {
        query: {
          accountId: 1000,
          repositoryIds: '1,2',
          branchName: 'master',
          scanId: undefined,
          status: 'VULNERABILITY,MARK_AS_FIXED',
          isParanoid: undefined
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([]);

      await filters(req, res);

      expect(send).toBeCalledWith({
        engineRule: [],
        introducedBy: [],
        language: [],
        severity: [],
        path: [],
        rule: [],
        status: [],
        type: []
      });
    });

    it('Should throw error if status is invalid', async () => {
      const req = {
        query: {
          accountId: 1000,
          repositoryIds: '1,2',
          branchName: 'master',
          scanId: undefined,
          status: 'VULNERABILITY,MARK_AS_FIXED,whaTEver',
          isParanoid: undefined
        },
        user: { provider: 'github', githubNickname: 'test' },
        permission: permissionMock
      };

      getAllowedIdsMock.mockReturnValueOnce([1, 2]);

      let error;
      try {
        await filters(req, res);
      } catch (e) {
        error = e;
      }

      expect(error).toStrictEqual(
        new Error(
          "Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum"
        )
      );
    });
  });
});
