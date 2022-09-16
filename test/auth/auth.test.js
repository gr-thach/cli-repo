describe('auth', () => {
  let auth;
  const expiresAt = 7200 * 1000 + new Date().getTime();

  beforeAll(() => {
    process.env = Object.assign(process.env, {
      GUARDRAILS_JWT_TOKEN_SECRET: 'jwt-private',
      ENVIRONMENT: 'testing'
    });

    // eslint-disable-next-line global-require
    auth = require('../../src/auth/auth');
  });

  it('should properly generate tokens', () => {
    const jwtForUser = auth.generateJWT(
      [{ provider: 'github', login: 'nickname', accessToken: 'token' }],
      expiresAt
    );
    expect(jwtForUser).toEqual(
      expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)
    );
  });
});
