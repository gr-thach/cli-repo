import AccountHelper from '../../src/helpers/account';
import { env } from '../../config';
import {
  updateAccount,
  createAccounts,
  createAccount,
  findBaseAccountsByProviderInternalIds,
  findBaseAccountByProviderInternalId
} from '../../src/helpers/core-api/accounts';
import { createSubscriptions } from '../../src/helpers/core-api/subscriptions';
import { createSubscriptionChangelogs } from '../../src/helpers/core-api/subscriptionChangelogs';
import { findPlanByCode } from '../../src/helpers/core-api/plans';
import { findUserByProviderInternalId } from '../../src/helpers/core-api/users';

jest.mock('../../src/helpers/core-api/accounts');
jest.mock('../../src/helpers/core-api/subscriptions');
jest.mock('../../src/helpers/core-api/subscriptionChangelogs');
jest.mock('../../src/helpers/core-api/plans');
jest.mock('../../src/helpers/core-api/users');
jest.mock('../../src/helpers/core-api/permissions');
jest.mock('../../config');

describe('Accounts helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    findUserByProviderInternalId.mockReturnValueOnce({ idUser: 123 });
    env.GUARDRAILS_CLI_TOKEN_SECRET = 'dummy-cli-token-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const gitlabProvider = 'GITLAB';
  const githubProvider = 'GITHUB';
  const validUser = {
    login: 'valid-user-login',
    provider: 'github',
    providerInternalId: 123
  };
  const validGitlabGroup = {
    id: 20,
    full_path: 'test-group'
  };

  describe('constructor', () => {
    it('Should throw error if no provider is provided', async () => {
      expect.assertions(1);

      const invalidProvider = null;

      try {
        // eslint-disable-next-line
        new AccountHelper(invalidProvider, validUser);
      } catch (e) {
        expect(e.message).toContain('Invalid provider null');
      }
    });

    it('Should throw error if no user is provided', async () => {
      expect.assertions(1);

      const invalidUser = null;

      try {
        // eslint-disable-next-line
        new AccountHelper(gitlabProvider, invalidUser);
      } catch (e) {
        expect(e.message).toContain('Invalid user');
      }
    });
  });

  const expectAccountNotCreatedOrUpdated = () => {
    expect(createAccount.mock.calls.length).toEqual(0);
    expect(createAccounts.mock.calls.length).toEqual(0);
    expect(updateAccount.mock.calls.length).toEqual(0);

    expect(createSubscriptions.mock.calls.length).toEqual(0);
    expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(0);
    expect(findPlanByCode).not.toHaveBeenCalled();
  };

  describe('syncGitlabGroups', () => {
    it("Shouldn't create accounts if no Gitlab groups is given.", async () => {
      const groups = [];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));

      await accountHelper.syncGitlabGroups(groups);

      expectAccountNotCreatedOrUpdated();
    });

    it('Creating accounts for Gitlab groups should only be allowed if provider is set to Gitlab', async () => {
      expect.hasAssertions();

      const invalidProvider = 'GITHUB';

      const accountHelper = new AccountHelper(invalidProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));

      try {
        await accountHelper.syncGitlabGroups([validGitlabGroup]);
      } catch (e) {
        expectAccountNotCreatedOrUpdated();
        expect(e.message).toEqual('_createGitlabGroupAccount only works for provider = GITLAB');
      }
    });

    it("Shouldn't create account if Gitlab group doesn't have an id.", async () => {
      expect.hasAssertions();

      const groups = [
        {
          full_path: 'my-root-group'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (e) {
        expect(e.message).toEqual('Expected Gitlab group to have an id.');
        expectAccountNotCreatedOrUpdated();
      }
    });

    it("Shouldn't create account if Gitlab group doesn't have path or full_path defined.", async () => {
      expect.hasAssertions();

      const groups = [
        {
          id: 20
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (e) {
        expect(e.message).toEqual(
          'Expected Gitlab group (20) to have either a path or a full_path.'
        );
        expectAccountNotCreatedOrUpdated();
      }
    });

    it("Shouldn't create account if an account already exist for a given Gitlab group.", async () => {
      const accounts = [
        {
          idAccount: 103,
          providerInternalId: '25',
          login: 'my-root-group',
          type: 'ORGANIZATION',
          provider: 'GITLAB'
        }
      ];
      const groups = [
        {
          id: 25,
          full_path: 'my-root-group'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      await accountHelper.syncGitlabGroups(groups);

      expectAccountNotCreatedOrUpdated();
    });

    it('Should create account for Gitlab root-group.', async () => {
      const freePlan = {
        idPlan: 99
      };
      const createdAccount = {
        idAccount: 101,
        providerInternalId: '20',
        type: 'ORGANIZATION',
        provider: 'GITLAB'
      };
      const groups = [
        {
          id: 20,
          full_path: 'test-root-group'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([createdAccount]));
      createAccount.mockReturnValueOnce(Promise.resolve(createdAccount));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount.mock.calls[0][0]).toEqual({
        login: 'test-root-group',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        providerInternalId: '20',
        createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
        cliToken: '06b9d6817d570903b8f0357ba26242a45fab3f5e4a5188efd5b8d5952276f38f'
      });
      expect(createSubscriptions.mock.calls[0][0]).toEqual([
        {
          fkAccount: 101,
          fkPlan: 99,
          interval: 'YEARLY',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/)
        }
      ]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
      expect(findPlanByCode).toBeCalledWith('FREE');
      expect(updateAccount).not.toHaveBeenCalled();
    });

    it('Should create account for Gitlab sub-group.', async () => {
      const freePlan = {
        idPlan: 95
      };
      const createdAccount = {
        idAccount: 103,
        providerInternalId: '25',
        type: 'ORGANIZATION',
        provider: 'GITLAB'
      };
      const groups = [
        {
          id: 25,
          full_path: 'my-root-group/test-sub-group'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([createdAccount]));
      createAccount.mockReturnValueOnce(Promise.resolve(createdAccount));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount.mock.calls[0][0]).toEqual({
        login: 'my-root-group%2Ftest-sub-group',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        providerInternalId: '25',
        createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
        cliToken: '3af8354e978fd41c99b61b13654ebed0f4ff08e519c9c3e9f529a667caff1692'
      });
      expect(createSubscriptions.mock.calls[0][0]).toEqual([
        {
          fkAccount: 103,
          fkPlan: 95,
          interval: 'YEARLY',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/)
        }
      ]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
      expect(findPlanByCode).toBeCalledWith('FREE');
      expect(updateAccount).not.toHaveBeenCalled();
    });

    it('Should create Gitlab group login based on full_path.', async () => {
      const group = {
        id: 25,
        full_path: 'path/to/sub-group'
      };
      const createdAccount = {
        idAccount: 103,
        providerInternalId: '25',
        type: 'ORGANIZATION',
        provider: 'GITLAB'
      };
      const freePlan = {
        idPlan: 95
      };
      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([createdAccount]));
      createAccount.mockReturnValueOnce(Promise.resolve(createdAccount));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      const groups = [group];

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount.mock.calls[0][0]).toEqual({
        login: 'path%2Fto%2Fsub-group',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        providerInternalId: '25',
        createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
        cliToken: '3af8354e978fd41c99b61b13654ebed0f4ff08e519c9c3e9f529a667caff1692'
      });
    });

    it("Should create Gitlab group login based on path if full_path doesn't exist.", async () => {
      const group = {
        id: 25,
        path: 'user-account'
      };
      const createdAccount = {
        idAccount: 103,
        providerInternalId: '25',
        type: 'ORGANIZATION',
        provider: 'GITLAB'
      };
      const freePlan = {
        idPlan: 95
      };
      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([]));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([createdAccount]));
      createAccount.mockReturnValueOnce(Promise.resolve(createdAccount));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      const groups = [group];

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount.mock.calls[0][0]).toEqual({
        login: 'user-account',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        providerInternalId: '25',
        createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
        cliToken: '3af8354e978fd41c99b61b13654ebed0f4ff08e519c9c3e9f529a667caff1692'
      });
    });

    it('Should update account if full_path on Gitlab group and login on account differs.', async () => {
      const group = {
        id: 30,
        full_path: 'path/to/new-group-name'
      };
      const account = {
        idAccount: 50,
        providerInternalId: '30',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        login: 'path%2Fto%2Fold-group-name'
      };
      const updatedAccount = {
        idAccount: 50,
        providerInternalId: '30',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        login: 'path%2Fto%2Fnew-group-name'
      };

      const groups = [group];
      const accounts = [account];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([updatedAccount]));

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount).not.toHaveBeenCalled();
      expect(createAccounts).not.toHaveBeenCalled();
      expect(updateAccount).toBeCalledWith(
        50,
        expect.objectContaining({
          login: 'path%2Fto%2Fnew-group-name'
        })
      );
    });

    it('Should update account if path on Gitlab group and login on account differs.', async () => {
      const group = {
        id: 30,
        path: 'new-group-name'
      };
      const account = {
        idAccount: 50,
        providerInternalId: '30',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        login: 'test'
      };
      const updatedAccount = {
        idAccount: 50,
        providerInternalId: '30',
        type: 'ORGANIZATION',
        provider: 'GITLAB',
        login: 'new-group-name'
      };
      const groups = [group];
      const accounts = [account];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve([updatedAccount]));

      await accountHelper.syncGitlabGroups(groups);

      expect(createAccount).not.toHaveBeenCalled();
      expect(createAccounts).not.toHaveBeenCalled();
      expect(updateAccount).toBeCalledWith(
        50,
        expect.objectContaining({
          login: 'new-group-name'
        })
      );
    });

    it("Shouldn't update account if Gitlab group doesn't have an id", async () => {
      expect.hasAssertions();

      const groups = [
        {
          full_path: 'my-root-group/test-sub-group'
        }
      ];
      const accounts = [
        {
          idAccount: 103,
          providerInternalId: '25',
          type: 'ORGANIZATION',
          provider: 'GITLAB'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (e) {
        expectAccountNotCreatedOrUpdated();
        expect(e.message).toEqual('Expected Gitlab group to have an id.');
      }
    });

    it("Shouldn't update account if Gitlab group doesn't have path nor full_path defined", async () => {
      expect.hasAssertions();

      const groups = [
        {
          id: 25
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (e) {
        expectAccountNotCreatedOrUpdated();
        expect(e.message).toEqual(
          'Expected Gitlab group (25) to have either a path or a full_path.'
        );
      }
    });

    it("Should throw error if accounts retrieved from db doesn't have a matching Gilab group", async () => {
      expect.hasAssertions();

      const groups = [
        {
          id: 30,
          path: 'new-group-name'
        }
      ];
      const accounts = [
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'test'
        },
        {
          idAccount: 51,
          providerInternalId: '31',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'test2'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (err) {
        expect(err.message).toBe(
          'Expected to find a matching Gitlab group for account (51) but non was found.'
        );
      }
    });

    it('Update multiple accounts if Gitlab groups have changed', async () => {
      const groups = [
        {
          id: 30,
          path: 'new-group-1-name'
        },
        {
          id: 40,
          path: 'new-group-2-name'
        }
      ];
      const accounts = [
        {
          idAccount: 51,
          providerInternalId: '40',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'old-group-2-name'
        },
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'old-group-1-name'
        }
      ];
      const updatedAccounts = [
        {
          idAccount: 51,
          providerInternalId: '40',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'new-group-2-name'
        },
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'new-group-1-name'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(updatedAccounts));

      await accountHelper.syncGitlabGroups(groups);

      expect(updateAccount).toHaveBeenCalledTimes(2);
      expect(updateAccount).toBeCalledWith(
        50,
        expect.objectContaining({
          login: 'new-group-1-name'
        })
      );
      expect(updateAccount).toBeCalledWith(
        51,
        expect.objectContaining({
          login: 'new-group-2-name'
        })
      );
    });

    it('Updating Gitlab groups are only allowed if provider is set to Gitlab', async () => {
      expect.hasAssertions();

      const groups = [
        {
          id: 30,
          path: 'new-group-1-name'
        }
      ];
      const accounts = [
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'old-group-1-name'
        }
      ];
      const invalidProvider = 'GITHUB';

      const accountHelper = new AccountHelper(invalidProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      try {
        await accountHelper.syncGitlabGroups(groups);
      } catch (e) {
        expectAccountNotCreatedOrUpdated();
        expect(e.message).toEqual('updateGitlabGroupAccount only works for provider = GITLAB');
      }
    });

    it("Don't update account if login hasn't changed (based on path on Gitlab group)", async () => {
      const groups = [
        {
          id: 30,
          path: 'new-group-name'
        }
      ];
      const accounts = [
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'new-group-name'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      await accountHelper.syncGitlabGroups(groups);

      expectAccountNotCreatedOrUpdated();
    });

    it("Don't update account if login hasn't changed (based on full_path on Gitlab group)", async () => {
      const groups = [
        {
          id: 30,
          full_path: 'new-group-name'
        }
      ];
      const accounts = [
        {
          idAccount: 50,
          providerInternalId: '30',
          type: 'ORGANIZATION',
          provider: 'GITLAB',
          login: 'new-group-name'
        }
      ];

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));
      findBaseAccountsByProviderInternalIds.mockReturnValueOnce(Promise.resolve(accounts));

      await accountHelper.syncGitlabGroups(groups);

      expectAccountNotCreatedOrUpdated();
    });
  });

  describe('syncGitlabUser', () => {
    it('Should create account for Gitlab user.', async () => {
      const freePlan = {
        idPlan: 79
      };
      const createdAccount = {
        idAccount: 300,
        providerInternalId: '50',
        login: 'my-username',
        type: 'USER',
        provider: 'GITLAB'
      };
      const gitlabUser = {
        id: 50,
        username: 'my-username',
        kind: 'user'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(undefined));
      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(undefined));
      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(createdAccount));
      createAccount.mockReturnValueOnce(Promise.resolve(createdAccount));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      await accountHelper.syncGitlabUser(gitlabUser);

      expect(createAccount.mock.calls[0][0]).toEqual({
        login: 'my-username',
        type: 'USER',
        provider: 'GITLAB',
        providerInternalId: '50',
        createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
        // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
        cliToken: 'b849a5a4459ded84e7c984498408a479e41e371f3780db90932a16ab97b8a98c'
      });
      expect(createSubscriptions.mock.calls[0][0]).toEqual([
        {
          fkAccount: 300,
          fkPlan: 79,
          interval: 'YEARLY',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/)
        }
      ]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
      expect(findPlanByCode).toBeCalledWith('FREE');
    });

    it("Shouldn't create account for Gitlab user if user don't have a username.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        id: 50,
        kind: 'user'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(undefined));

      try {
        await accountHelper.syncGitlabUser(gitlabUser);
      } catch (e) {
        expect(e.message).toEqual('Expected Gitlab user (50) to have a username.');
        expectAccountNotCreatedOrUpdated();
      }
    });

    it("Shouldn't create account for Gitlab user if user doesn't have an id.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        kind: 'user',
        username: 'my-username'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(undefined));

      try {
        await accountHelper.syncGitlabUser(gitlabUser);
      } catch (e) {
        expect(e.message).toEqual("Gitlab user doesn't have an id.");
        expectAccountNotCreatedOrUpdated();
      }
    });

    it("Shouldn't create account for Gitlab user if Gitlab user isn't of kind 'user'.", async () => {
      expect.hasAssertions();

      const gitlabUser = {
        id: 20,
        username: 'my-username'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(undefined));

      try {
        await accountHelper.syncGitlabUser(gitlabUser);
      } catch (e) {
        expect(e.message).toEqual("Expected Gitlab user (20) to be of kind 'user'.");
        expectAccountNotCreatedOrUpdated();
      }
    });

    it('Should update account for Gitlab user if username has changed.', async () => {
      const account = {
        idAccount: 300,
        providerInternalId: '50',
        login: 'my-username',
        type: 'USER',
        provider: 'GITLAB'
      };
      const updatedAccount = {
        idAccount: 300,
        providerInternalId: '50',
        login: 'new-username',
        type: 'USER',
        provider: 'GITLAB'
      };
      const gitlabUser = {
        id: 50,
        username: 'new-username',
        kind: 'user'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(account));
      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(updatedAccount));

      await accountHelper.syncGitlabUser(gitlabUser);

      expect(createAccount).not.toHaveBeenCalled();
      expect(updateAccount).toHaveBeenCalledTimes(1);
      expect(updateAccount).toBeCalledWith(
        300,
        expect.objectContaining({
          login: 'new-username'
        })
      );
    });

    it("Shouldn't update account for Gitlab user if username hasn't changed.", async () => {
      const account = {
        idAccount: 300,
        providerInternalId: '50',
        login: 'my-username',
        type: 'USER',
        provider: 'GITLAB'
      };
      const gitlabUser = {
        id: 50,
        username: 'my-username',
        kind: 'user'
      };

      const accountHelper = new AccountHelper(gitlabProvider, validUser);

      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(account));
      findBaseAccountByProviderInternalId.mockReturnValueOnce(Promise.resolve(account));

      await accountHelper.syncGitlabUser(gitlabUser);

      expectAccountNotCreatedOrUpdated();
    });
  });

  describe('bulkCreateFromGithubInstallations', () => {
    it('Creating accounts for Github installations should only be allowed if provider is set to Github', async () => {
      expect.hasAssertions();

      const groups = [];
      const accounts = [];
      const invalidProvider = 'GITLAB';

      const accountHelper = new AccountHelper(invalidProvider, validUser);

      try {
        await accountHelper.bulkCreateFromGithubInstallations(groups, accounts);
      } catch (e) {
        expect(e.message).toEqual(
          'bulkCreateFromGithubInstallations only works for provider = GITHUB'
        );
      }
    });

    it("Shouldn't create accounts if no Github installations is given.", async () => {
      const installations = [];

      const accountHelper = new AccountHelper(githubProvider, validUser);

      createAccounts.mockReturnValueOnce(Promise.resolve([]));

      await accountHelper.bulkCreateFromGithubInstallations(installations);

      expect(createAccounts.mock.calls[0][0]).toEqual([]);
      expect(createSubscriptions.mock.calls[0][0]).toEqual([]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
    });

    it('Should create account for Github user installation.', async () => {
      const freePlan = {
        idPlan: 999
      };
      const createdAccount = {
        idAccount: 1010,
        providerInternalId: '200'
      };
      const installations = [
        {
          id: 200,
          account: {
            id: 300,
            type: 'USER',
            login: 'my-user'
          }
        }
      ];

      const accountHelper = new AccountHelper(githubProvider, validUser);

      createAccounts.mockReturnValueOnce(Promise.resolve([createdAccount]));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      await accountHelper.bulkCreateFromGithubInstallations(installations);

      expect(createAccounts.mock.calls[0][0]).toEqual([
        {
          login: 'my-user',
          type: 'USER',
          provider: 'GITHUB',
          installationId: 200,
          providerInternalId: '300',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
          cliToken: 'f4de54fbf94bcc321f64b80a12acbd36b5caa2a5f3ac8b3f653cbb6ce582d510'
        }
      ]);
      expect(createSubscriptions.mock.calls[0][0]).toEqual([
        {
          fkAccount: 1010,
          fkPlan: 999,
          interval: 'YEARLY',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/)
        }
      ]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
      expect(findPlanByCode).toBeCalledWith('FREE');
    });

    it('Should create account for Github organization installation.', async () => {
      const freePlan = {
        idPlan: 899
      };
      const createdAccount = {
        idAccount: 2010,
        providerInternalId: '200'
      };
      const installations = [
        {
          id: 500,
          account: {
            id: 600,
            type: 'ORGANIZATION',
            login: 'my-github-org'
          }
        }
      ];

      const accountHelper = new AccountHelper(githubProvider, validUser);

      createAccounts.mockReturnValueOnce(Promise.resolve([createdAccount]));
      findPlanByCode.mockReturnValueOnce(Promise.resolve(freePlan));

      await accountHelper.bulkCreateFromGithubInstallations(installations);

      expect(createAccounts.mock.calls[0][0]).toEqual([
        {
          login: 'my-github-org',
          type: 'ORGANIZATION',
          provider: 'GITHUB',
          installationId: 500,
          providerInternalId: '600',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          // Calculated using https://www.freeformatter.com/hmac-generator.html#ad-output
          cliToken: '12c84bf1f72010f39f790bcaff1d3d89e3e4f640744f655ed2c1898e75b33e4f'
        }
      ]);
      expect(createSubscriptions.mock.calls.length).toEqual(1);
      expect(createSubscriptions.mock.calls[0][0]).toEqual([
        {
          fkAccount: 2010,
          fkPlan: 899,
          interval: 'YEARLY',
          createdAt: expect.stringMatching(/([0-9-:.TZ]){24}/),
          updatedAt: expect.stringMatching(/([0-9-:.TZ]){24}/)
        }
      ]);
      expect(createSubscriptionChangelogs).toHaveBeenCalledTimes(1);
      expect(findPlanByCode).toBeCalledWith('FREE');
    });
  });
});
