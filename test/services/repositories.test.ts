import RepositoriesService from '../../src/services/repositories';
import {
  Account,
  AccountType,
  GitProvider,
  PlanCode,
  Repository,
  RequestUser,
  SessionProvider,
  SubscriptionInterval
} from '../../src/interfaces';
import {
  // deleteRepositoriesByIds,
  hasRepositoryData
  // updateRepository
} from '../../src/helpers/core-api/repositories';

jest.mock('../../src/helpers/core-api/repositories');

const baseRepo: Repository = {
  idRepository: 1,
  providerInternalId: '123',
  isEnabled: true,
  name: 'test 1',
  fkAccount: 1,
  provider: GitProvider.GITHUB,
  isPrivate: true,
  isMonorepo: false,
  fkParentRepository: null,
  path: '',
  description: '',
  fullName: 'test 1',
  language: '',
  badgeToken: '',
  configuration: {},
  defaultBranch: 'main',
  createdAt: '2022-01-01',
  updatedAt: '2022-01-01'
};

const account: Account = {
  idAccount: 1,
  fkParentAccount: null,
  installationId: 888888,
  login: 'test-account',
  provider: GitProvider.GITHUB,
  providerInternalId: '1234',
  type: AccountType.ORGANIZATION,
  createdAt: '2022-01-01',
  updatedAt: '2022-01-01',
  deletedAt: null,
  configuration: null,
  cliToken: '',
  providerMetadata: {},
  filterReposByWriteAccess: false,
  findingConfiguration: null,
  usersSynchronized: true,
  idRootAccount: 1,
  childrenQty: 0,
  subscription: {
    idSubscription: 1,
    fkPlan: 7,
    plan: {
      idPlan: 7,
      name: 'Professional',
      code: PlanCode.PROFESSIONAL,
      description: 'For organizations that take the security of their users seriously.',
      bullets: '',
      queuePriority: 1,
      createdAt: '2020-08-19',
      updatedAt: '2020-08-19',
      features: []
    },
    interval: SubscriptionInterval.MONTHLY,
    periodStart: null,
    periodEnd: null,
    stripeSubscriptionId: null,
    stripeCustomerId: '',
    status: 'active',
    hadFreeTrial: true,
    isCheckoutCompleted: true,
    trialEnd: 0,
    cancelAtPeriodEnd: false,
    extraRepositories: 0,
    updatedAt: '2022-01-01'
  }
};

const user: RequestUser = {
  provider: SessionProvider.GITHUB,
  providerInternalId: '999',
  user: {
    id: '999',
    username: 'test-user-1',
    name: 'test user 1',
    email: 'test@test.com',
    avatarUrl: ''
  }
};

describe('RepositoriesService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('deduplicateRepositories', () => {
    it('Test basic deduplication', async () => {
      const repositories: Repository[] = [
        { ...baseRepo },
        { ...baseRepo, idRepository: 2, createdAt: '2022-01-05', updatedAt: '2022-01-05' }
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(repositoryId => {
        return repositoryId === 1;
      });

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(1);
      // Should keep the older one
      expect(newRepositories[0]).toEqual(repositories[0]);
    });

    it('Test nothing to deduplicate', async () => {
      const repositories: Repository[] = [
        { ...baseRepo },
        {
          ...baseRepo,
          idRepository: 2,
          providerInternalId: '124', // different provider internal id
          createdAt: '2022-01-05',
          updatedAt: '2022-01-05'
        }
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(repositoryId => {
        return repositoryId === 1;
      });

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(repositories.length);
      // should reeturn in the same order
      expect(newRepositories[0]).toEqual(repositories[0]);
      expect(newRepositories[1]).toEqual(repositories[1]);
    });

    it('Test both repos have data', async () => {
      const repositories: Repository[] = [
        { ...baseRepo },
        { ...baseRepo, idRepository: 2, createdAt: '2022-01-05', updatedAt: '2022-01-05' }
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(() => true);

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(repositories.length);
      // should reeturn in the same order
      expect(newRepositories[0]).toEqual(repositories[0]);
      expect(newRepositories[1]).toEqual(repositories[1]);
    });

    it('Test deduplication with 3 repos with no data but only one enabled', async () => {
      const repositories: Repository[] = [
        { ...baseRepo, isEnabled: false },
        { ...baseRepo, idRepository: 2, createdAt: '2022-01-05', updatedAt: '2022-01-05' },
        {
          ...baseRepo,
          isEnabled: false,
          idRepository: 3,
          createdAt: '2022-01-02',
          updatedAt: '2022-01-02'
        }
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(() => false);

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(1);
      // Should keep the enabled one
      expect(newRepositories[0]).toEqual(repositories[1]);
    });

    it('Test with no repositories', async () => {
      const repositories: Repository[] = [];

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(0);
    });

    it('Test multiple providerInternalIds', async () => {
      const repositories: Repository[] = [
        { ...baseRepo, providerInternalId: '10' },
        {
          ...baseRepo,
          providerInternalId: '10',
          idRepository: 2,
          createdAt: '2020-01-10',
          updatedAt: '2022-01-10'
        }, // older one enabled
        {
          ...baseRepo,
          providerInternalId: '10',
          idRepository: 3,
          isEnabled: false,
          createdAt: '2022-01-05',
          updatedAt: '2022-01-05'
        },

        {
          ...baseRepo,
          providerInternalId: '20',
          idRepository: 4,
          createdAt: '2022-01-21',
          updatedAt: '2022-01-21'
        },
        {
          ...baseRepo,
          providerInternalId: '20',
          idRepository: 5,
          createdAt: '2022-01-20',
          updatedAt: '2022-01-20'
        },

        {
          ...baseRepo,
          providerInternalId: '30',
          idRepository: 6,
          createdAt: '2022-01-15',
          updatedAt: '2022-01-15'
        },
        {
          ...baseRepo,
          providerInternalId: '30',
          idRepository: 7,
          createdAt: '2022-01-14',
          updatedAt: '2022-01-14'
        },
        {
          ...baseRepo,
          providerInternalId: '30',
          idRepository: 8,
          createdAt: '2022-01-13',
          updatedAt: '2022-01-13'
        } // the one with data
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(repositoryId => {
        // 1st case, 3 repos, none of them have data, the older enabled one should be kept
        // 2nd case, 2 repos, both have data, we should keep both
        // 3rd case, 3 repos, 1 has data, we should keep that one
        return ![1, 2, 3, 6, 7].includes(repositoryId);
      });

      const service = new RepositoriesService(user);
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(4);
      // Should keep the enabled one
      expect(newRepositories[0]).toEqual(repositories[1]);
      expect(newRepositories[1]).toEqual(repositories[3]);
      expect(newRepositories[2]).toEqual(repositories[4]);
      expect(newRepositories[3]).toEqual(repositories[7]);
    });

    it('Test enable repo with data', async () => {
      const repositories: Repository[] = [
        { ...baseRepo, isEnabled: false },
        { ...baseRepo, idRepository: 2, createdAt: '2022-01-05', updatedAt: '2022-01-05' }
      ];

      (hasRepositoryData as jest.Mock).mockImplementation(repositoryId => {
        return repositoryId === 1;
      });

      const service = new RepositoriesService(user);
      jest
        .spyOn(service, 'enableRepository')
        .mockImplementation((repository: Repository, isEnabled: boolean) => {
          return new Promise(() => ({ ...repository, isEnabled }));
        });
      const newRepositories = await service.deduplicateRepositories(repositories, account);

      expect(newRepositories.length).toBe(1);
      expect(newRepositories[0]).toEqual({ ...repositories[0], isEnabled: true });
      expect(service.enableRepository).toHaveBeenCalledTimes(1);
    });
  });
});
