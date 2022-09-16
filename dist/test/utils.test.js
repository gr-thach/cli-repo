"use strict";
const { linkToCode, linkToScan } = require('../src/helpers/common');
const { ACCOUNT_PROVIDER } = require('../src/helpers/core-api/enums');
describe('Utils', () => {
    beforeEach(() => {
        jest.resetModules();
    });
    describe('linkToCode', () => {
        it('should create a valid github link', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.GITHUB, login: 'test-account' }, 'test-repo', 'src/index.js', 10, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://github.com/test-account/test-repo/blob/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js#L10');
        });
        it('should create a github link without line number if no line number is provided', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.GITHUB, login: 'test-account' }, 'test-repo', 'src/index.js', undefined, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://github.com/test-account/test-repo/blob/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js');
        });
        it('should create a valid gitlab link', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.GITLAB, login: 'test-account' }, 'test-repo', 'src/index.js', 10, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://gitlab.com/test-account/test-repo/blob/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js#L10');
        });
        it('should create a gitlab link without line number if no line number is provided', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.GITLAB, login: 'test-account' }, 'test-repo', 'src/index.js', undefined, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://gitlab.com/test-account/test-repo/blob/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js');
        });
        it('should create a valid bitbucket link', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.BITBUCKET, login: 'test-account' }, 'test-repo', 'src/index.js', 10, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://bitbucket.org/test-account/test-repo/src/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js#lines-10');
        });
        it('should create a bitbucket link without line number if no line number is provided', () => {
            const link = linkToCode({ provider: ACCOUNT_PROVIDER.BITBUCKET, login: 'test-account' }, 'test-repo', 'src/index.js', undefined, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://bitbucket.org/test-account/test-repo/src/26297c4643e321aee111b2cde0a76d8da60bb4f8/src/index.js');
        });
        it('should throw error if git provider is invalid', () => {
            expect(() => linkToCode({ provider: 'INVALID-GIT-PROVIDER-NAME', login: 'test-account' }, 'test-repo', 'src/index.js', 10, '26297c4643e321aee111b2cde0a76d8da60bb4f8')).toThrow("Invalid git provider 'INVALID-GIT-PROVIDER-NAME'");
        });
    });
    describe('linkToScan', () => {
        it('should create a valid link to dashboard scan for GITHUB', () => {
            const link = linkToScan({ provider: ACCOUNT_PROVIDER.GITHUB, login: 'test-account' }, 3, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://dashboard.dev.guardrails.io/gh/test-account/repos/3/scans?sha=26297c4643e321aee111b2cde0a76d8da60bb4f8');
        });
        it('should create a valid link to dashboard scan for GITLAB', () => {
            const link = linkToScan({ provider: ACCOUNT_PROVIDER.GITLAB, login: 'test-account' }, 3, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://dashboard.dev.guardrails.io/gl/test-account/repos/3/scans?sha=26297c4643e321aee111b2cde0a76d8da60bb4f8');
        });
        it('should create a valid link to dashboard scan for BITBUCKET', () => {
            const link = linkToScan({ provider: ACCOUNT_PROVIDER.BITBUCKET, login: 'test-account' }, 3, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://dashboard.dev.guardrails.io/bb/test-account/repos/3/scans?sha=26297c4643e321aee111b2cde0a76d8da60bb4f8');
        });
        it('should create a valid link to dashboard scan for BITBUCKET_DATA_CENTER', () => {
            const link = linkToScan({
                provider: ACCOUNT_PROVIDER.BITBUCKET_DATA_CENTER,
                providerMetadata: { projectKey: 'test-account' }
            }, 3, '26297c4643e321aee111b2cde0a76d8da60bb4f8');
            expect(link).toEqual('https://dashboard.dev.guardrails.io/bbdc/test-account/repos/3/scans?sha=26297c4643e321aee111b2cde0a76d8da60bb4f8');
        });
    });
});
//# sourceMappingURL=utils.test.js.map