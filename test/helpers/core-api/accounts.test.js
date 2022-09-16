jest.mock('../../../config', () => ({ env: { CORE_API_URI: 'http://core-api' } }));
const moxios = require('moxios');
const accountsCore = require('../../../src/helpers/core-api/accounts');
const { coreAxios } = require('../../../src/helpers/core-api/index');

describe('Accounts core-api', () => {
  beforeEach(() => {
    moxios.install(coreAxios);
  });
  afterEach(() => {
    moxios.uninstall();
  });

  describe('findAccountById', () => {
    it('it should return account', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: { idAccount: 1 }
        });
      });

      const account = await accountsCore.findAccountById(1);
      expect(account).toEqual({ idAccount: 1 });
    });
  });

  describe('findBaseAccountByCliToken', () => {
    it('should return account', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            data: {
              accounts: {
                nodes: [{ idAccount: 1, login: 'login1' }]
              }
            }
          }
        });
      });

      const account = await accountsCore.findBaseAccountByCliToken('cliToken', 'github');
      expect(account).toEqual({ idAccount: 1, login: 'login1' });
    });
  });

  describe('updateAccount', () => {
    it('should return account', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            data: {
              updateAccount: {
                account: { idAccount: 1, login: 'login1', cliToken: 'kek' }
              }
            }
          }
        });
      });

      const account = await accountsCore.updateAccount(1, { cliToken: 'kek' });
      expect(account).toEqual({ idAccount: 1, login: 'login1', cliToken: 'kek' });
    });
  });

  describe('createAccounts', () => {
    it('should return account', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: [
            { data: { createAccount: { account: { login: 'login1' } } } },
            { data: { createAccount: { account: { login: 'login2' } } } }
          ]
        });
      });

      const accounts = await accountsCore.createAccounts([
        { login: 'login1' },
        { login: 'login2' }
      ]);
      expect(accounts).toEqual([{ login: 'login1' }, { login: 'login2' }]);
    });
  });

  describe('destroyAccount', () => {
    it('should return account', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/accounts/1');
        expect(request.config.method).toBe('delete');
        request.respondWith({
          status: 200
        });
      });

      await accountsCore.destroyAccount(1);
    });
  });
});
