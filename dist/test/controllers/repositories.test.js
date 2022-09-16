"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repositories_1 = require("../../src/controllers/repositories");
const repositories_2 = require("../../src/helpers/core-api/repositories");
const permission_1 = __importDefault(require("../../src/services/permissions/permission"));
jest.mock('../../src/helpers/core-api/repositories');
const getAllowedIdsMock = jest.fn();
jest.mock('../../src/services/permissions/permission', () => {
    return jest.fn().mockImplementation(() => ({
        getAllowedIds: getAllowedIdsMock,
        repositoriesEnforce: getAllowedIdsMock
    }));
});
const permissionMock = new permission_1.default();
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
        permission_1.default.factory = jest.fn(() => new permission_1.default({}));
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
            repositories_2.queryRepositoriesByIds.mockReturnValue({ repositories: [repository], totalCount: 1 });
            await (0, repositories_1.list)(req, res);
            expect(send).toBeCalledWith({
                repositories: [{ ...repository, write: true }],
                totalCount: 1
            });
            expect(repositories_2.queryRepositoriesByIds).toHaveBeenCalledTimes(1);
            expect(repositories_2.queryRepositoriesByIds).toHaveBeenCalledWith([1], {
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
            repositories_2.queryRepositoriesByIds.mockReturnValue({ repositories: [repository], totalCount: 1 });
            await (0, repositories_1.list)(req, res);
            expect(send).toBeCalledWith({
                repositories: [{ ...repository, write: true }],
                totalCount: 1
            });
            expect(repositories_2.queryRepositoriesByIds).toHaveBeenCalledTimes(1);
            expect(repositories_2.queryRepositoriesByIds).toHaveBeenCalledWith([1], {
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
            repositories_2.getRepositoryById.mockImplementation(() => repository);
            await (0, repositories_1.find)(req, res);
            expect(send).toBeCalledWith({ ...repository, write: false });
        });
    });
});
//# sourceMappingURL=repositories.test.js.map