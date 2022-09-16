"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_1 = require("../../src/helpers/scan");
const gitlab_1 = require("../../src/helpers/gitlab");
const scans_1 = require("../../src/helpers/core-api/scans");
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
            scans_1.queryScanCountPerRepo.mockReturnValueOnce(0);
            await (0, gitlab_1.enableDisableOnGitlab)(gitlabAccessTokenTest, repositoryTest, isEnabled);
            expect(scan_1.triggerScan).toBeCalledTimes(1);
        });
        it('should NOT call triggerFirstScan when a repository is enabled but has already been scanned', async () => {
            const isEnabled = true;
            scans_1.queryScanCountPerRepo.mockReturnValueOnce(1);
            await (0, gitlab_1.enableDisableOnGitlab)(gitlabAccessTokenTest, repositoryTest, isEnabled);
            expect(scan_1.triggerScan).toBeCalledTimes(0);
        });
        it('should NOT call triggerFirstScan when a repository is disabled', async () => {
            const isEnabled = false;
            scans_1.queryScanCountPerRepo.mockReturnValueOnce(0);
            await (0, gitlab_1.enableDisableOnGitlab)(gitlabAccessTokenTest, repositoryTest, isEnabled);
            expect(scan_1.triggerScan).toBeCalledTimes(0);
        });
    });
});
//# sourceMappingURL=gitlab.test.js.map