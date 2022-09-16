import { triggerScan } from '../../src/helpers/scan';
import { enableDisableOnGitlab } from '../../src/helpers/gitlab';
import { queryScanCountPerRepo } from '../../src/helpers/core-api/scans';

jest.mock('../../src/services/git/gitlab', () => {
  return function GitLabServiceMock() {
    return {
      addHooksAndMemberToGitlabProjects: jest.fn(),
      removeHooksAndMemberFromGitlabProjects: jest.fn(),
      getBranchSha: jest.fn()
    };
  };
});
jest.mock('../../src/helpers/scan');
jest.mock('../../src/helpers/core-api/scans');

describe('Gitlab', () => {
  describe('enableDisableOnGitlab', () => {
    const gitlabAccessTokenTest = 'accessTokenTest';
    let repositoryTest;
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
      repositoryTest = {
        idRepository: 99,
        provider: 'GITLAB',
        account: {
          login: 'test'
        }
      };
    });
    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });
    it('should call triggerFirstScan when a repository is enabled', async () => {
      const isEnabled = true;
      queryScanCountPerRepo.mockReturnValueOnce(0);
      await enableDisableOnGitlab(gitlabAccessTokenTest, repositoryTest, isEnabled);

      expect(triggerScan).toBeCalledTimes(1);
    });
    it('should NOT call triggerFirstScan when a repository is enabled but has already been scanned', async () => {
      const isEnabled = true;
      queryScanCountPerRepo.mockReturnValueOnce(1);
      await enableDisableOnGitlab(gitlabAccessTokenTest, repositoryTest, isEnabled);

      expect(triggerScan).toBeCalledTimes(0);
    });
    it('should NOT call triggerFirstScan when a repository is disabled', async () => {
      const isEnabled = false;
      queryScanCountPerRepo.mockReturnValueOnce(0);
      await enableDisableOnGitlab(gitlabAccessTokenTest, repositoryTest, isEnabled);

      expect(triggerScan).toBeCalledTimes(0);
    });
  });
});
