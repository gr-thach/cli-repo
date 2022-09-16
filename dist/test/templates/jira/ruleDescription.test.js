"use strict";
const getRuleDescription = require('../../../src/templates/jira/ruleDescription');
describe('rule description', () => {
    describe('getRuleDescription', () => {
        it('get rule description for valid rule name', () => {
            const ruleName = 'GR0001';
            const description = getRuleDescription(ruleName);
            expect(description)
                .toBe(`SQL injections are dangerous because they can be easily identified by attackers.
Hackers can use SQL injections to read from and sometimes even write to your
database. SQL injections are very common and have been the cause of many
high-profile breaches. Check out [this video|https://www.youtube.com/watch?v=oLahd_ksX6c] for a high-level explanation.`);
        });
        it('get rule description for invalid rule name', () => {
            const ruleName = 'Not a valid rule name';
            const description = getRuleDescription(ruleName);
            expect(description).toBe('');
        });
        it('get rule description for undefined rule name', () => {
            const ruleName = undefined;
            const description = getRuleDescription(ruleName);
            expect(description).toBe('');
        });
    });
});
//# sourceMappingURL=ruleDescription.test.js.map