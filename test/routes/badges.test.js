const request = require('supertest');

const mockFindRepositoryForBadges = jest.fn();
jest.mock('../../src/helpers/core-api/repositories', () => ({
  ...jest.requireActual('../../src/helpers/core-api/repositories'),
  findRepositoryForBadges: mockFindRepositoryForBadges
}));

jest.mock('minio', () => ({
  ...jest.requireActual('minio'),
  Client: jest.fn().mockImplementation(() => ({ setRequestOptions: jest.fn() }))
}));

const fixture = (isPrivate, isEnabled, token = '') => {
  return {
    badgeToken: token,
    isPrivate: isPrivate,
    isEnabled: isEnabled
  };
};

describe('Badges route', () => {
  let app;
  beforeAll(() => {
    // eslint-disable-next-line global-require
    app = require('../../src/app');
  });

  describe(':organization/:repository.svg', () => {
    it('should return "not installed" redirect (!repo)', async () => {
      mockFindRepositoryForBadges.mockReturnValue(undefined);
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .expect(302)
        .expect(
          'location',
          'https://img.shields.io/badge/GuardRails-not%20installed-lightgray.svg'
        );
    });

    it('should return "not installed" redirect (private && !badgeToken)', async () => {
      mockFindRepositoryForBadges.mockReturnValue(fixture(true, true));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .expect(302)
        .expect(
          'location',
          'https://img.shields.io/badge/GuardRails-not%20installed-lightgray.svg'
        );
    });

    it('should return "not installed" redirect (badgeToken !== token)', async () => {
      mockFindRepositoryForBadges.mockReturnValue(fixture(true, true, 'repoToken'));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .query('token=someToken')
        .expect(302)
        .expect(
          'location',
          'https://img.shields.io/badge/GuardRails-not%20installed-lightgray.svg'
        );
    });

    it('should return "disabled" redirect (!enabled)', async () => {
      const badgeToken = 'aMatchingToken';
      mockFindRepositoryForBadges.mockReturnValue(fixture(true, false, badgeToken));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .query(`token=${badgeToken}`)
        .expect(302)
        .expect('location', 'https://img.shields.io/badge/GuardRails-disabled-lightgray.svg');
    });

    it('should return "enabled" redirect (!private)', async () => {
      const badgeToken = 'aNotMatchingToken';
      mockFindRepositoryForBadges.mockReturnValue(fixture(false, true, 'repoToken'));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .query(`token=${badgeToken}`)
        .expect(302)
        .expect('location', 'https://img.shields.io/badge/GuardRails-enabled-brightgreen.svg');
    });

    it('should return "enabled" redirect (!private, !token)', async () => {
      mockFindRepositoryForBadges.mockReturnValue(fixture(false, true));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .expect(302)
        .expect('location', 'https://img.shields.io/badge/GuardRails-enabled-brightgreen.svg');
    });

    it('should return "enabled" redirect', async () => {
      const badgeToken = 'aMatchingToken';
      mockFindRepositoryForBadges.mockReturnValue(fixture(true, true, badgeToken));
      await request(app)
        .get('/v2/badges/account/repo.svg')
        .query(`token=${badgeToken}`)
        .expect(302)
        .expect('location', 'https://img.shields.io/badge/GuardRails-enabled-brightgreen.svg');
    });
  });
});
