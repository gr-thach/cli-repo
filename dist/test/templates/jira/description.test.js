"use strict";
const createFindingDescription = require('../../../src/templates/jira/description');
const { linkToScan, linkToCode } = require('../../../src/helpers/common');
const { ACCOUNT_PROVIDER } = require('../../../src/helpers/core-api/enums');
const { env } = require('../../../config');
jest.mock('../../../config');
describe('description', () => {
    const repository = {
        idRepository: 2,
        name: 'test-repo'
    };
    const genericFinding = {
        path: 'src/index.js',
        lineNumber: 10,
        branch: 'master',
        language: 'javascript',
        rule: {
            title: 'Insecure Use of Regular Expressions',
            name: 'GR0003',
            docs: 'insecure_use_of_regular_expressions.html'
        }
    };
    const scaFinding = {
        path: 'src/index.js',
        lineNumber: 10,
        branch: 'master',
        language: 'javascript',
        rule: {
            title: 'Insecure Use of Regular Expressions',
            name: 'GR0003',
            docs: 'insecure_use_of_regular_expressions.html'
        },
        metadata: {
            dependencyName: 'amqplib',
            patchedVersions: '1.3.0'
        }
    };
    const VALID_ACCOUNT_LOGIN = 'test-org';
    const VALID_SHA = '9afdba3d9c9c3877559c951ee29bcae008f38d0d';
    const copy = obj => JSON.parse(JSON.stringify(obj));
    describe('createFindingDescription', () => {
        beforeEach(() => {
            env.BITBUCKET_DATA_CENTER_SITE_URL = 'https://bitbucket-data-center.example.com';
        });
        it('create generic description for finding', () => {
            const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, genericFinding.path, genericFinding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding: genericFinding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Solution: Follow the steps described [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
        it('create generic description for finding in Gitlab', () => {
            const account = { provider: ACCOUNT_PROVIDER.GITLAB, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, genericFinding.path, genericFinding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding: genericFinding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gl/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Solution: Follow the steps described [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
        it('create generic description for finding in Bitbucket', () => {
            const account = { provider: ACCOUNT_PROVIDER.BITBUCKET, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, genericFinding.path, genericFinding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding: genericFinding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/bb/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Path: [src/index.js|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Line: [10|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Branch: [master|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Solution: Follow the steps described [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
        it('create generic description for finding in Bitbucket Data Center', () => {
            const account = {
                provider: ACCOUNT_PROVIDER.BITBUCKET_DATA_CENTER,
                providerMetadata: { projectKey: VALID_ACCOUNT_LOGIN }
            };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, genericFinding.path, genericFinding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding: genericFinding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/bbdc/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://bitbucket-data-center.example.com/projects/test-org/repos/test-repo/browse/src/index.js?at=9afdba3d9c9c3877559c951ee29bcae008f38d0d#10]
- Path: [src/index.js|https://bitbucket-data-center.example.com/projects/test-org/repos/test-repo/browse/src/index.js?at=9afdba3d9c9c3877559c951ee29bcae008f38d0d#10]
- Line: [10|https://bitbucket-data-center.example.com/projects/test-org/repos/test-repo/browse/src/index.js?at=9afdba3d9c9c3877559c951ee29bcae008f38d0d#10]
- Branch: [master|https://bitbucket-data-center.example.com/projects/test-org/repos/test-repo/browse/src/index.js?at=9afdba3d9c9c3877559c951ee29bcae008f38d0d#10]
- Solution: Follow the steps described [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
        it('create generic description for finding not containing a rule', () => {
            const finding = copy(genericFinding);
            delete finding.rule;
            const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]`);
        });
        it('create generic description for finding not containing a line number', () => {
            const finding = copy(genericFinding);
            delete finding.lineNumber;
            const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Solution: Follow the steps described [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
        it('create generic description for finding not containing a language', () => {
            const finding = copy(genericFinding);
            delete finding.language;
            const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
            const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
            const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
            const description = createFindingDescription({
                finding,
                repository,
                dashboardLink,
                providerCodeLink
            });
            expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
        });
    });
    it('create description for SCA finding', () => {
        const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, scaFinding.path, scaFinding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding: scaFinding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0
- More information can be found [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
    it('create description for SCA finding in Gitlab', () => {
        const account = { provider: ACCOUNT_PROVIDER.GITLAB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, scaFinding.path, scaFinding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding: scaFinding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gl/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://gitlab.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0
- More information can be found [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
    it('create description for SCA finding in Bitbucket', () => {
        const account = { provider: ACCOUNT_PROVIDER.BITBUCKET, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, scaFinding.path, scaFinding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding: scaFinding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/bb/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Path: [src/index.js|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Line: [10|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Branch: [master|https://bitbucket.org/test-org/test-repo/src/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#lines-10]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0
- More information can be found [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
    it('create description for SCA finding with no patch version', () => {
        const finding = copy(scaFinding);
        delete finding.metadata.patchedVersions;
        const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Dependency Name: amqplib
- Solution: No patch available
- More information can be found [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
    it('create description for SCA finding with no rule', () => {
        const finding = copy(scaFinding);
        delete finding.rule;
        const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0`);
    });
    it('create description for SCA finding with no line number', () => {
        const finding = copy(scaFinding);
        delete finding.lineNumber;
        const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0
- More information can be found [here|https://docs.guardrails.io/docs/en/vulnerabilities/javascript/insecure_use_of_regular_expressions.html]

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
    it('create description for SCA finding with no language', () => {
        const finding = copy(scaFinding);
        delete finding.language;
        const account = { provider: ACCOUNT_PROVIDER.GITHUB, login: VALID_ACCOUNT_LOGIN };
        const dashboardLink = linkToScan(account, repository.idRepository, VALID_SHA);
        const providerCodeLink = linkToCode(account, repository.name, finding.path, finding.lineNumber, VALID_SHA);
        const description = createFindingDescription({
            finding,
            repository,
            dashboardLink,
            providerCodeLink
        });
        expect(description).toBe(`Vulnerability Details:
- [Insecure Use of Regular Expressions|https://dashboard.dev.guardrails.io/gh/test-org/repos/2/scans?sha=9afdba3d9c9c3877559c951ee29bcae008f38d0d]
- Repository: [test-repo|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Path: [src/index.js|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Line: [10|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Branch: [master|https://github.com/test-org/test-repo/blob/9afdba3d9c9c3877559c951ee29bcae008f38d0d/src/index.js#L10]
- Dependency Name: amqplib
- Solution: Upgrade to 1.3.0

Description:
Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.`);
    });
});
//# sourceMappingURL=description.test.js.map