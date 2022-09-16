"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moxios_1 = __importDefault(require("moxios"));
const preHook_1 = require("../../src/controllers/preHook");
const scan_1 = require("../../src/helpers/scan");
const { findRepositoryWithAccountByCliTokenAndProviderInternalId, findRepositoryWithAccountByProviderInternalId } = require('../../src/helpers/core-api/repositories');
const { findBaseAccountByCliToken } = require('../../src/helpers/core-api/accounts');
const { getScanByCliToken, getScan: getScanById } = require('../../src/helpers/core-api/scans');
const { getUploadUrl } = require('../../src/helpers/cli');
jest.mock('../../src/helpers/cli');
jest.mock('../../src/helpers/core-api/repositories');
jest.mock('../../src/helpers/core-api/accounts');
jest.mock('../../src/helpers/core-api/scans');
jest.mock('../../src/helpers/scan');
jest.mock('../../config', () => ({
    ...jest.requireActual('../../config'),
    env: {
        ENVIRONMENT: 'onpremise',
        GUARDRAILS_PRE_HOOK_TOKEN: 'this-is-a-pre-hook-token'
    }
}));
jest.mock('minio', () => ({
    ...jest.requireActual('minio'),
    Client: jest.fn().mockImplementation(() => ({ setRequestOptions: jest.fn() }))
}));
describe('PreHook controller', () => {
    let res;
    let send;
    beforeEach(() => {
        send = jest.fn();
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.resetAllMocks();
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
        jest.resetAllMocks();
        moxios_1.default.uninstall();
    });
    const cliToken = '425a6a05e5c9d7d79f4a26fbdccc99a76b847f5b8f5143758e7d789b36afc904';
    const preHookToken = 'this-is-a-pre-hook-token';
    const repositoryProviderInternalId = '1';
    const sha = '864703b04dc567f06d46228eda9e24896229bef5';
    const branch = 'master';
    const gitArchiveFileName = '8022d6a5-1003-4195-bc03-19d4bbbafa11';
    const gitDiffFileName = '91a0dfdb-2170-4de8-bcb9-9c63ecc8ed5a';
    const idScan = '4378024e-1b02-4694-a4ee-b54a46d1ed60';
    const repository = {
        idRepository: 1,
        account: {
            provider: 'bitbucket_data_center',
            providerMetadata: {
                projectKey: 'PROJECT_1'
            },
            subscription: {}
        }
    };
    describe('trigger scan', () => {
        it('Should trigger scan using cli token', async () => {
            const config = { bundles: [{ general: ['detect-secrets', 'gr-secrets', 'semgrep'] }] };
            const req = {
                body: {
                    cliToken,
                    repositoryProviderInternalId,
                    sha,
                    branch,
                    gitArchiveFileName,
                    gitDiffFileName,
                    config
                }
            };
            findBaseAccountByCliToken.mockReturnValueOnce(repository.account);
            findRepositoryWithAccountByCliTokenAndProviderInternalId.mockReturnValueOnce(repository);
            scan_1.triggerScan.mockReturnValueOnce(idScan);
            await (0, preHook_1.trigger)(req, res);
            expect(scan_1.triggerScan).toBeCalledWith(sha, branch, repository.account, repository, 'PRE_HOOK', 2, gitArchiveFileName, gitDiffFileName, config);
            expect(send).toBeCalledWith({
                idScan,
                dashboardUrl: 'https://dashboard.dev.guardrails.io/bbdc/PROJECT_1/repos/1/scans?sha=864703b04dc567f06d46228eda9e24896229bef5'
            });
        });
        it('Should trigger scan using pre-hook token', async () => {
            const config = { bundles: [{ general: ['detect-secrets', 'gr-secrets', 'semgrep'] }] };
            const req = {
                body: {
                    preHookToken,
                    repositoryProviderInternalId,
                    sha,
                    branch,
                    gitArchiveFileName,
                    gitDiffFileName,
                    config
                }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repository);
            scan_1.triggerScan.mockReturnValueOnce(idScan);
            await (0, preHook_1.trigger)(req, res);
            expect(scan_1.triggerScan).toBeCalledWith(sha, branch, repository.account, repository, 'PRE_HOOK', 2, gitArchiveFileName, gitDiffFileName, config);
            expect(send).toBeCalledWith({
                idScan,
                dashboardUrl: 'https://dashboard.dev.guardrails.io/bbdc/PROJECT_1/repos/1/scans?sha=864703b04dc567f06d46228eda9e24896229bef5'
            });
        });
        it('Should throw error when missing both cli-token and pre-hook token in body parameters', async () => {
            expect.hasAssertions();
            const req = {
                body: {
                    repositoryProviderInternalId,
                    sha,
                    branch,
                    gitArchiveFileName,
                    gitDiffFileName
                }
            };
            try {
                await (0, preHook_1.trigger)(req, res);
            }
            catch (err) {
                expect(err.message).toBe('Requires cli token or pre-hook token.');
            }
        });
    });
    describe('upload url', () => {
        it('Should get upload url with filename', async () => {
            const req = {
                body: {
                    cliToken
                }
            };
            findBaseAccountByCliToken.mockReturnValueOnce(repository.account);
            getUploadUrl.mockReturnValueOnce('https://minio.localhost/upload-url');
            await (0, preHook_1.uploadUrl)(req, res);
        });
        it('Should throw error when missing both cli-token and pre-hook token in body parameters for "upload url" endpoint', async () => {
            expect.hasAssertions();
            const req = {
                body: {}
            };
            try {
                await (0, preHook_1.uploadUrl)(req, res);
            }
            catch (err) {
                expect(err.message).toBe('Requires cli token or pre-hook token.');
            }
        });
    });
    describe('getScan', () => {
        it('Should get scan information by cli-token', async () => {
            const req = {
                query: {
                    cliToken,
                    idScan
                }
            };
            const scan = {
                idScan: '110cef4f-828f-4c93-9e7f-469d61b34639',
                type: 'PRE_HOOK',
                status: {
                    idScanStatus: 1,
                    name: 'queued'
                },
                result: undefined
            };
            findBaseAccountByCliToken.mockReturnValueOnce(repository.account);
            getScanByCliToken.mockReturnValueOnce(scan);
            await (0, preHook_1.getScan)(req, res);
            expect(send).toBeCalledWith({
                idScan: '110cef4f-828f-4c93-9e7f-469d61b34639',
                status: {
                    idScanStatus: 1,
                    name: 'queued'
                },
                result: undefined
            });
        });
        it('Should get scan information by pre-hook-token', async () => {
            const req = {
                query: {
                    preHookToken,
                    idScan
                }
            };
            const scan = {
                idScan: '110cef4f-828f-4c93-9e7f-469d61b34639',
                type: 'PRE_HOOK',
                status: {
                    idScanStatus: 1,
                    name: 'queued'
                },
                result: undefined
            };
            getScanById.mockReturnValueOnce(scan);
            await (0, preHook_1.getScan)(req, res);
            expect(send).toBeCalledWith({
                idScan: '110cef4f-828f-4c93-9e7f-469d61b34639',
                status: {
                    idScanStatus: 1,
                    name: 'queued'
                },
                result: undefined
            });
        });
        it("Should throw 'not found' if scan doesn't exist", async () => {
            expect.hasAssertions();
            const req = {
                query: {
                    cliToken,
                    idScan
                }
            };
            findBaseAccountByCliToken.mockReturnValueOnce(repository.account);
            getScanByCliToken.mockReturnValueOnce(undefined);
            try {
                await (0, preHook_1.getScan)(req, res);
            }
            catch (err) {
                expect(err.message).toBe('Scan not found');
            }
        });
        it('Should throw error if not cli-token and not pre-hook-token query parameters is set', async () => {
            expect.hasAssertions();
            const req = {
                query: {
                    idScan
                }
            };
            try {
                await (0, preHook_1.getScan)(req, res);
            }
            catch (err) {
                expect(err.message).toBe('Requires cli token or pre-hook token.');
            }
        });
    });
    describe('getVersion', () => {
        it('Valid Gitlab pre-hook plugin version should return up-to-date', async () => {
            const req = {
                query: {
                    provider: 'GITLAB',
                    version: '1.0.0'
                }
            };
            await (0, preHook_1.getVersion)(req, res);
            expect(send).toBeCalledWith({
                status: 'UP_TO_DATE'
            });
        });
        it('Invalid Gitlab pre-hook plugin version should return "unsupported version"', async () => {
            const req = {
                query: {
                    provider: 'GITLAB',
                    version: '0.9.0'
                }
            };
            await (0, preHook_1.getVersion)(req, res);
            expect(send).toBeCalledWith({
                status: 'UNSUPPORTED_VERSION',
                info: 'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
            });
        });
        it('Valid Bitbucket pre-hook plugin version should return up-to-date', async () => {
            const req = {
                query: {
                    provider: 'BITBUCKET_DATA_CENTER',
                    version: '1.0.0'
                }
            };
            await (0, preHook_1.getVersion)(req, res);
            expect(send).toBeCalledWith({
                status: 'UP_TO_DATE'
            });
        });
        it('Invalid Bitbucket pre-hook plugin version should return "unsupported version"', async () => {
            const req = {
                query: {
                    provider: 'BITBUCKET_DATA_CENTER',
                    version: '0.9.0'
                }
            };
            await (0, preHook_1.getVersion)(req, res);
            expect(send).toBeCalledWith({
                status: 'UNSUPPORTED_VERSION',
                info: 'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
            });
        });
        it('Invalid provider name when fetching version information, should throw error', async () => {
            expect.hasAssertions();
            const req = {
                query: {
                    provider: 'NEW_GIT_PROVIDER',
                    version: '1.0.0'
                }
            };
            try {
                await (0, preHook_1.getVersion)(req, res);
            }
            catch (err) {
                expect(err.message).toBe("Unexpected provider 'NEW_GIT_PROVIDER'.");
            }
        });
    });
    describe('getConfiguration', () => {
        it('Should get configration using cli-token', async () => {
            const req = {
                query: { cliToken, provider: 'BITBUCKET_DATA_CENTER', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: true,
                configuration: {
                    preHook: {
                        enabled: true
                    }
                },
                account: {
                    configuration: {
                        preHook: {
                            enabled: true
                        }
                    }
                }
            };
            findBaseAccountByCliToken.mockReturnValueOnce(repository.account);
            findRepositoryWithAccountByCliTokenAndProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: true
            });
        });
        it('Should get configration using pre-hook-token', async () => {
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: true,
                configuration: {
                    preHook: {
                        enabled: true
                    }
                },
                account: {
                    configuration: {
                        preHook: {
                            enabled: true
                        }
                    }
                }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: true
            });
        });
        it('Account level configuration should be respected if repo level config is not set.', async () => {
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: true,
                configuration: {
                    preHook: {}
                },
                account: {
                    configuration: {
                        preHook: {
                            enabled: true
                        }
                    }
                }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: true
            });
        });
        it('Repo level configuration should override account level config.', async () => {
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: true,
                configuration: {
                    preHook: {
                        enabled: true
                    }
                },
                account: {
                    configuration: {
                        preHook: {
                            enabled: false
                        }
                    }
                }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: true
            });
        });
        it('If repository is not enabled then it should override both account level and repo level config', async () => {
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: false,
                configuration: {
                    preHook: {
                        enabled: true
                    }
                },
                account: {
                    configuration: {
                        preHook: {
                            enabled: true
                        }
                    }
                }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: false
            });
        });
        it('Pre-hook should be disabled by default, if account and repo level config is not set.', async () => {
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            const repo = {
                isEnabled: true,
                account: {}
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(repo);
            await (0, preHook_1.getConfiguration)(req, res);
            expect(send).toBeCalledWith({
                enabled: false
            });
        });
        it('Should throw 404 if repo is not found when fetching configuration', async () => {
            expect.hasAssertions();
            const req = {
                query: { preHookToken, provider: 'GITLAB', repositoryProviderInternalId }
            };
            findRepositoryWithAccountByProviderInternalId.mockReturnValueOnce(undefined);
            try {
                await (0, preHook_1.getConfiguration)(req, res);
            }
            catch (err) {
                expect(err.message).toBe('Repository not found.');
            }
        });
    });
});
//# sourceMappingURL=preHook.test.js.map