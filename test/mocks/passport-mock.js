export const getPassportAuthenticateCallback = passport => {
  if (passport.authenticate.mock.calls.length === 1) {
    return passport.authenticate.mock.calls[0][1];
  }

  throw new Error(
    `Passport authenticate function was called ${passport.authenticate.mock.calls.length} times, expected it to be called once.`
  );
};

export const PassportMock = {
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  use: jest.fn(),
  initialize: jest.fn(),
  authenticateReturnFn: jest.fn(),

  initMock: () => {
    PassportMock.authenticate.mockReturnValue(PassportMock.authenticateReturnFn);
  },

  callback: async (error, user) => {
    const passportCallback = getPassportAuthenticateCallback(PassportMock);
    await passportCallback(null, user);
  },

  expectAuthenticateToHaveBeenCalledWithProvider: provider => {
    expect(PassportMock.authenticate.mock.calls.length).toEqual(1);
    expect(PassportMock.authenticate.mock.calls[0][0]).toEqual(provider);
  },

  expectAuthenticateReturnFuctionToHaveBeenCalledWith: (req, res, next) => {
    expect(PassportMock.authenticateReturnFn).toHaveBeenCalledWith(req, res, next);
  }
};
