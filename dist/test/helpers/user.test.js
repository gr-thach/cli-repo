"use strict";
const { parseUser } = require('../../src/helpers/user');
describe('Parse logged in user', () => {
    it('should parse correctly', async () => {
        const user = {
            provider: 'gitlab',
            gitlabNickname: 'gitlab-user',
            githubNickname: 'github-user'
        };
        const { login, provider } = parseUser(user);
        expect(login).toEqual('gitlab-user');
        expect(provider).toEqual('gitlab');
    });
    it("shouldn't work with unexpected provider", async () => {
        const user = {
            provider: 'unknown',
            gitlabNickname: 'gitlab-user',
            githubNickname: 'github-user'
        };
        try {
            parseUser(user);
        }
        catch (e) {
            expect(e.message).toBe('Invalid user provider');
        }
    });
    it('should work with empty user', async () => {
        const user = {};
        try {
            parseUser(user);
        }
        catch (e) {
            expect(e.message).toBe('Invalid user provider');
        }
    });
});
//# sourceMappingURL=user.test.js.map