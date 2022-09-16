"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moxios_1 = __importDefault(require("moxios"));
const scans_1 = require("../../src/controllers/scans");
const scans_2 = require("../../src/helpers/core-api/scans");
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
        moxios_1.default.install();
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
        moxios_1.default.uninstall();
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
            scans_2.queryScansFilters.mockReturnValueOnce(scanFilters);
            await (0, scans_1.filters)(req, res);
            expect(send).toBeCalledWith(scanFilters);
            expect(scans_2.queryScansFilters).toBeCalledWith({
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
            await (0, scans_1.filters)(req, res);
            expect(send).toBeCalledWith({
                type: [],
                sha: [],
                sender: []
            });
        });
    });
});
//# sourceMappingURL=scans.test.js.map