"use strict";
const createFindingSummary = require('../../../src/templates/jira/summary');
describe('summary', () => {
    const repository = {
        name: 'test-repo'
    };
    describe('createFindingSummary', () => {
        it('create generic summary for finding containing rule title', () => {
            const finding = {
                path: 'src/index.js',
                rule: {
                    title: 'Insecure Use of Regular Expressions'
                }
            };
            const summary = createFindingSummary({ finding, repository });
            expect(summary).toBe('Insecure Use of Regular Expressions in test-repo/src/index.js');
        });
        it('create generic summary for finding not containing a rule', () => {
            const finding = {
                path: 'src/index.js'
            };
            const summary = createFindingSummary({ finding, repository });
            expect(summary).toBe('Vulnerability found in test-repo/src/index.js');
        });
        it('create SCA summary for finding', () => {
            const finding = {
                metadata: {
                    dependencyName: 'amqplib'
                }
            };
            const summary = createFindingSummary({ finding, repository });
            expect(summary).toBe('Vulnerable Library - test-repo: amqplib');
        });
    });
});
//# sourceMappingURL=summary.test.js.map