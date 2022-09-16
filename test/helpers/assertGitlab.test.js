const {
  assertIsGitlabGroup,
  assertIsGitlabUser,
  assertHasMatchingGitlabGroup,
  assertAccountMatchesGitlabGroup,
  assertAccountMatchesGitlabUser
} = require('../../src/helpers/assertGitlab');

describe('assertGitlab', () => {
  describe('assertIsGitlabGroup', () => {
    it('A valid Gitlab group should pass the assertion', async () => {
      const gitlabGroup = {
        id: 123,
        path: 'test-group',
        full_path: 'test-group'
      };

      assertIsGitlabGroup(gitlabGroup);
    });

    it("A Gitlab group without an id shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const gitlabGroup = {
        path: 'test-group',
        full_path: 'test-group'
      };

      try {
        assertIsGitlabGroup(gitlabGroup);
      } catch (err) {
        expect(err.message).toBe('Expected Gitlab group to have an id.');
      }
    });

    it("A Gitlab group without a path or full_path shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const gitlabGroup = {
        id: 123
      };

      try {
        assertIsGitlabGroup(gitlabGroup);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Gitlab group (123) to have either a path or a full_path.'
        );
      }
    });

    it("A Gitlab group with a username shouldn't pass assertion (as this is probably a user and not a group).", async () => {
      expect.hasAssertions();

      const gitlabGroup = {
        id: 123,
        path: 'test-group',
        full_path: 'test-group',
        username: 'my-username'
      };

      try {
        assertIsGitlabGroup(gitlabGroup);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Gitlab group (123) to not have a username defined, is this a Gitlab user and not a group?.'
        );
      }
    });
  });

  describe('assertIsGitlabUser', () => {
    it('A valid Gitlab user should pass the assertion', async () => {
      const gitlabUser = {
        id: 123,
        username: 'my-username',
        kind: 'user'
      };

      assertIsGitlabUser(gitlabUser);
    });

    it("A Gitlab user without a id shouldn't pass assertion.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        username: 'my-username',
        kind: 'user'
      };

      try {
        assertIsGitlabUser(gitlabUser);
      } catch (err) {
        expect(err.message).toBe("Gitlab user doesn't have an id.");
      }
    });

    it("A Gitlab user without a username shouldn't pass assertion.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        id: 123,
        kind: 'user'
      };

      try {
        assertIsGitlabUser(gitlabUser);
      } catch (err) {
        expect(err.message).toBe('Expected Gitlab user (123) to have a username.');
      }
    });

    it("A Gitlab user with kind not set to 'user' shouldn't pass validation.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        id: 123,
        username: 'my-username'
      };

      try {
        assertIsGitlabUser(gitlabUser);
      } catch (err) {
        expect(err.message).toBe("Expected Gitlab user (123) to be of kind 'user'.");
      }
    });
  });

  describe('assertHasMatchingGitlabGroup', () => {
    it('should pass assertion if all accounts matches a corresponding Gitlab group', async () => {
      const accounts = [
        {
          idAccount: 2,
          providerInternalId: '123',
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '345',
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '234',
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        }
      ];
      const groups = [
        {
          id: 123,
          path: 'group-1',
          full_path: 'group-1'
        },
        {
          id: 234,
          path: 'group-2',
          full_path: 'group-2'
        },
        {
          id: 345,
          path: 'group-3',
          full_path: 'group-3'
        }
      ];

      assertHasMatchingGitlabGroup(accounts, groups);
    });

    it("shouldn't pass assertion when an account doesn't have a matching Gitlab group", async () => {
      expect.hasAssertions();

      const accounts = [
        {
          idAccount: 2,
          providerInternalId: '123',
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '999', // <-- This should throw an error as there isn't a matching Gitlab group.
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '234',
          provider: 'GITLAB',
          type: 'ORGANIZATION'
        }
      ];
      const groups = [
        {
          id: 123,
          path: 'group-1',
          full_path: 'group-1'
        },
        {
          id: 234,
          path: 'group-2',
          full_path: 'group-2'
        },
        {
          id: 345,
          path: 'group-3',
          full_path: 'group-3'
        }
      ];

      try {
        assertHasMatchingGitlabGroup(accounts, groups);
      } catch (err) {
        expect(err.message).toBe(
          'Expected to find a matching Gitlab group for account (3) but non was found.'
        );
      }
    });
  });

  describe('assertHasMatchingGitlabGroup', () => {
    it('should pass assertion as account matches Gitlab group.', async () => {
      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'ORGANIZATION'
      };

      const gitlabGroup = {
        id: 123,
        path: 'group-1',
        full_path: 'group-1'
      };

      assertAccountMatchesGitlabGroup(account, gitlabGroup);
    });

    it("shouldn't pass assertion as providerInternalId doesn't match Gitlab group.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '999',
        provider: 'GITLAB',
        type: 'ORGANIZATION'
      };

      const gitlabGroup = {
        id: 123,
        path: 'group-1',
        full_path: 'group-1'
      };

      try {
        assertAccountMatchesGitlabGroup(account, gitlabGroup);
      } catch (err) {
        expect(err.message).toBe(
          'Expected account (2, 999, ORGANIZATION, GITLAB) to match Gitlab group (123).'
        );
      }
    });

    it("shouldn't pass assertion as provider isn't GITLAB.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITHUB',
        type: 'ORGANIZATION'
      };

      const gitlabGroup = {
        id: 123,
        path: 'group-1',
        full_path: 'group-1'
      };

      try {
        assertAccountMatchesGitlabGroup(account, gitlabGroup);
      } catch (err) {
        expect(err.message).toBe('Expected organization account provider to be GITLAB');
      }
    });

    it("shouldn't pass assertion as account isn't an organization.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'USER'
      };

      const gitlabGroup = {
        id: 123,
        path: 'group-1',
        full_path: 'group-1'
      };

      try {
        assertAccountMatchesGitlabGroup(account, gitlabGroup);
      } catch (err) {
        expect(err.message).toBe('Expected organization account to be of type ORGANIZATION');
      }
    });

    it("shouldn't pass assertion as Gitlab group doesn't have a path or full_path.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'ORGANIZATION'
      };

      const gitlabGroup = {
        id: 123
      };

      try {
        assertAccountMatchesGitlabGroup(account, gitlabGroup);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Gitlab group (123) to have either a path or a full_path.'
        );
      }
    });
  });

  describe('assertAccountMatchesGitlabUser', () => {
    it('should pass assertion as account matches Gitlab user.', async () => {
      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'USER'
      };

      const gitlabUser = {
        id: 123,
        username: 'my-username',
        kind: 'user'
      };

      assertAccountMatchesGitlabUser(account, gitlabUser);
    });

    it("shouldn't pass assertion as providerInternalId on account doesn't match Gitlab user.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '777',
        provider: 'GITLAB',
        type: 'USER'
      };

      const gitlabUser = {
        id: 123,
        username: 'my-username',
        kind: 'user'
      };

      try {
        assertAccountMatchesGitlabUser(account, gitlabUser);
      } catch (err) {
        expect(err.message).toBe(
          'Expected account (2, 777, USER, GITLAB) to match Gitlab user (123).'
        );
      }
    });

    it("shouldn't pass assertion as provider isn't set to GITLAB on account.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITHUB',
        type: 'USER'
      };

      const gitlabUser = {
        id: 123,
        username: 'my-username',
        kind: 'user'
      };

      try {
        assertAccountMatchesGitlabUser(account, gitlabUser);
      } catch (err) {
        expect(err.message).toBe('Expected account of type user to have GITLAB provider');
      }
    });

    it("shouldn't pass assertion as account type isn't USER.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'ORGANIZATION'
      };

      const gitlabUser = {
        id: 123,
        username: 'my-username',
        kind: 'user'
      };

      try {
        assertAccountMatchesGitlabUser(account, gitlabUser);
      } catch (err) {
        expect(err.message).toBe('Expected account of type user to be of type USER');
      }
    });

    it("shouldn't pass assertion as Gitlab user doesn't have a username.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'USER'
      };

      const gitlabUser = {
        id: 123,
        kind: 'user'
      };

      try {
        assertAccountMatchesGitlabUser(account, gitlabUser);
      } catch (err) {
        expect(err.message).toBe('Expected Gitlab user (123) to have a username.');
      }
    });
  });
});
