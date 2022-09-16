import { getFeatureValue } from '../../src/helpers/subscription';

const config = require('../../config');

jest.mock('../../config');

const subscription = {
  idSubscription: 1,
  status: 'active',
  plan: {
    idPlan: 1,
    features: [
      {
        feature: 'PRIVATE_REPOSITORIES',
        value: 20
      }
    ]
  }
};

let defaultEnv;

describe('helpers/subscription', () => {
  beforeAll(() => {
    defaultEnv = config.env.ENVIRONMENT;
  });
  beforeEach(() => {
    config.env.ENVIRONMENT = defaultEnv;
    config.env.ONPREMISE_MAX_DEVS = 20;
    config.env.ONPREMISE_MAX_REPOS = 0;
  });

  describe('getFeatureValue', () => {
    it('should return private repos value', async () => {
      const privateRepos = await getFeatureValue(subscription, 'PRIVATE_REPOSITORIES');
      expect(privateRepos).toEqual(20);
    });

    it('should fail for null subscription', async () => {
      expect.assertions(1);
      try {
        await getFeatureValue(null, 'PRIVATE_REPOSITORIES');
      } catch (error) {
        expect(error.message).toContain("Cannot read properties of null (reading 'plan')");
      }
    });

    it("shouldn't fail for null subscription when onpremise env", async () => {
      config.env.ENVIRONMENT = 'onpremise';
      const privateRepos = await getFeatureValue(null, 'PRIVATE_REPOSITORIES');
      expect(privateRepos).toEqual(Number.MAX_SAFE_INTEGER);
    });

    it('Should use MAX_REPOS when having no MAX_DEVS', async () => {
      config.env.ENVIRONMENT = 'onpremise';
      config.env.ONPREMISE_MAX_DEVS = 0;
      config.env.ONPREMISE_MAX_REPOS = 10;
      const privateRepos = await getFeatureValue(null, 'PRIVATE_REPOSITORIES');
      expect(privateRepos).toEqual(10);
    });
  });
});
