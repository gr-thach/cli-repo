"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportMock = exports.getPassportAuthenticateCallback = void 0;
const getPassportAuthenticateCallback = passport => {
    if (passport.authenticate.mock.calls.length === 1) {
        return passport.authenticate.mock.calls[0][1];
    }
    throw new Error(`Passport authenticate function was called ${passport.authenticate.mock.calls.length} times, expected it to be called once.`);
};
exports.getPassportAuthenticateCallback = getPassportAuthenticateCallback;
exports.PassportMock = {
    authenticate: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
    use: jest.fn(),
    initialize: jest.fn(),
    authenticateReturnFn: jest.fn(),
    initMock: () => {
        exports.PassportMock.authenticate.mockReturnValue(exports.PassportMock.authenticateReturnFn);
    },
    callback: async (error, user) => {
        const passportCallback = (0, exports.getPassportAuthenticateCallback)(exports.PassportMock);
        await passportCallback(null, user);
    },
    expectAuthenticateToHaveBeenCalledWithProvider: provider => {
        expect(exports.PassportMock.authenticate.mock.calls.length).toEqual(1);
        expect(exports.PassportMock.authenticate.mock.calls[0][0]).toEqual(provider);
    },
    expectAuthenticateReturnFuctionToHaveBeenCalledWith: (req, res, next) => {
        expect(exports.PassportMock.authenticateReturnFn).toHaveBeenCalledWith(req, res, next);
    }
};
//# sourceMappingURL=passport-mock.js.map