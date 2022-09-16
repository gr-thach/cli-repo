jest.mock('../../../config', () => ({ env: { CORE_API_URI: 'http://core-api' } }));
const moxios = require('moxios');
const repositoriesCore = require('../../../src/helpers/core-api/repositories');
const { findAccountById } = require('../../../src/helpers/core-api/accounts');
const { coreAxios } = require('../../../src/helpers/core-api/index');

jest.mock('../../../src/helpers/core-api/accounts');

describe('Repositories core-api', () => {
  beforeEach(() => {
    moxios.install(coreAxios);
  });
  afterEach(() => {
    moxios.uninstall(coreAxios);
  });

  describe('findRepositoryWithAccountByCliToken', () => {
    it.only('it should return repository with account', async () => {
      moxios.stubRequest('/graphql', {
        status: 200,
        response: {
          data: {
            repositories: {
              nodes: [
                {
                  id: 1,
                  name: 'name',
                  fkAccount: 1
                }
              ]
            }
          }
        }
      });

      findAccountById.mockReturnValueOnce({ idAccount: 1 });

      const repository = await repositoriesCore.findRepositoryWithAccountByCliToken(
        'cliToken',
        'name'
      );
      expect(repository).toEqual({
        id: 1,
        name: 'name',
        fkAccount: 1,
        account: { idAccount: 1 }
      });
    });

    it('it should return null', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            data: {
              repositories: {
                nodes: []
              }
            }
          }
        });
      });

      const account = await repositoriesCore.findRepositoryWithAccountByCliToken(
        'cliToken',
        'name'
      );
      expect(account).toEqual(null);
    });
  });

  describe('createRepositories', () => {
    it('should create repositories', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: [
            { data: { createRepository: { repository: { id: 1, name: 'name' } } } },
            { data: { createRepository: { repository: { id: 2, name: 'name' } } } }
          ]
        });
      });

      const account = await repositoriesCore.createRepositories([
        { id: 1, name: 'name' },
        { id: 2, name: 'name' }
      ]);
      expect(account).toEqual([
        { id: 1, name: 'name' },
        { id: 2, name: 'name' }
      ]);
    });
  });

  describe('updateRepository', () => {
    it('should update a repository', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            data: {
              updateRepository: {
                repository: {
                  id: 1,
                  name: 'updatedName'
                }
              }
            }
          }
        });
      });

      const repository = await repositoriesCore.updateRepository(1, {
        name: 'updatedName',
        updatedAt: new Date().toJSON()
      });
      expect(repository).toEqual({
        id: 1,
        name: 'updatedName'
      });
    });
  });
});
