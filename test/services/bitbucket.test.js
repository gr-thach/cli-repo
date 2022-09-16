import BitbucketService from '../../src/services/git/bitbucket';

// eslint-disable-next-line global-require
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');

jest.mock('../../config', () => ({
  env: {
    BITBUCKET_API_URL: 'https://bitbucket.example.com/2.0'
  }
}));

describe('BitbucketService', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  const accessToken = 'eeeeee-bbbb-cccc-dddd';
  const nickname = 'test-nickname';
  const account = {
    providerInternalId: '{aaaaa-bbbb-cccc-dddd}'
  };

  describe('pagination', () => {
    const createDummyObjects = numOfObjects => {
      const results = [];

      for (let i = 0; i < numOfObjects; i++) {
        results.push({ name: `dummy-object-${i}` });
      }

      return results;
    };

    test('should get multiple pages for api resource', async () => {
      const bitbucket = new BitbucketService(accessToken, nickname);
      const dummyRepositories = createDummyObjects(25);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          pagelen: 10,
          size: 25,
          page: 1,
          values: dummyRepositories.slice(0, 10),
          next: `${repositoryUrl}&page=2`
        }
      });

      fetchMock.mock(`${repositoryUrl}&page=2`, {
        status: 200,
        body: {
          pagelen: 10,
          size: 25,
          page: 2,
          values: dummyRepositories.slice(10, 20),
          next: `${repositoryUrl}&page=3`
        }
      });

      fetchMock.mock(`${repositoryUrl}&page=3`, {
        status: 200,
        body: {
          pagelen: 10,
          size: 25,
          page: 3,
          values: dummyRepositories.slice(20, 30)
        }
      });

      const response = await bitbucket.getRepositories(account);

      expect(response.length).toBe(25);

      for (let i = 0; i < 25; i++) {
        expect(response[i].name).toBe(`dummy-object-${i}`);
      }
    });

    test("should not get next page if there isn't a next page", async () => {
      const bitbucket = new BitbucketService(accessToken, nickname);
      const dummyRepositories = createDummyObjects(5);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          pagelen: 10,
          size: 5,
          page: 1,
          values: dummyRepositories
        }
      });

      const response = await bitbucket.getRepositories(account);

      expect(response.length).toBe(5);

      for (let i = 0; i < 5; i++) {
        expect(response[i].name).toBe(`dummy-object-${i}`);
      }
    });

    test("should throw error if pagination response doesn't contain a pagelen", async () => {
      expect.assertions(1);

      const bitbucket = new BitbucketService(accessToken, nickname);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          size: 5,
          page: 1,
          values: []
        }
      });

      try {
        await bitbucket.getRepositories(account);
      } catch (err) {
        expect(err.message).toBe(
          "Expected 'pagelen' in pagination response to be of type number, got undefined. Is this really a paginated resource?"
        );
      }
    });

    test("should throw error if pagination response doesn't contain a page property", async () => {
      expect.assertions(1);

      const bitbucket = new BitbucketService(accessToken, nickname);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          pagelen: 10,
          size: 0,
          values: []
        }
      });

      try {
        await bitbucket.getRepositories(account);
      } catch (err) {
        expect(err.message).toBe(
          "Expected 'page' in pagination response to be of type number, got undefined. Is this really a paginated resource?"
        );
      }
    });

    test("should throw error if pagination response doesn't contain a values property", async () => {
      expect.assertions(1);

      const bitbucket = new BitbucketService(accessToken, nickname);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          pagelen: 10,
          size: 0,
          page: 1
        }
      });

      try {
        await bitbucket.getRepositories(account);
      } catch (err) {
        expect(err.message).toBe(
          "Expected 'values' in pagination response to be an array, got undefined. Is this really a paginated resource?"
        );
      }
    });

    test("should throw error if 'next' isn't of type string in pagination response", async () => {
      expect.assertions(1);

      const bitbucket = new BitbucketService(accessToken, nickname);
      const dummyRepositories = createDummyObjects(25);

      const repositoryUrl = `https://bitbucket.example.com/2.0/repositories/${encodeURIComponent(
        account.providerInternalId
      )}`;

      fetchMock.mock(repositoryUrl, {
        status: 200,
        body: {
          pagelen: 10,
          size: 25,
          page: 1,
          values: dummyRepositories,
          next: 123
        }
      });

      try {
        await bitbucket.getRepositories(account);
      } catch (err) {
        expect(err.message).toBe(
          "Expected 'next' in pagination response to be of type string, got number. Is this really a paginated resource?"
        );
      }
    });
  });
});
