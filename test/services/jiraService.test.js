const JiraService = require('../../src/services/jira');

describe('JiraService', () => {
  const expectErrorMessage = (fn, errorMessage) => {
    expect.assertions(1);

    try {
      fn();
    } catch (err) {
      expect(err.message).toEqual(errorMessage);
    }
  };

  describe('validateUrl', () => {
    it('Url with http protocol should be allowed', () => {
      JiraService.validateUrl('http://domain.com');
    });

    it('Url with https protocol should be allowed', () => {
      JiraService.validateUrl('https://domain.com');
    });

    it('Url with ip number should be allowed', () => {
      JiraService.validateUrl('https://8.8.8.8');
    });

    it('Url with a port number should be allowed', () => {
      JiraService.validateUrl('https://domain.com:8080');
    });

    it('Url with a base path should be allowed', () => {
      JiraService.validateUrl('https://domain.com/base/path');
    });

    it("Should throw error if url doesn't contain a protocol", () => {
      const expectedErrorMessage = 'Invalid URL';
      expectErrorMessage(() => JiraService.validateUrl('domain.com'), expectedErrorMessage);
    });

    it("Should throw error if url doesn't contain a https or http protocol", () => {
      const expectedErrorMessage = 'ftp: is not a supported protocol.';
      expectErrorMessage(() => JiraService.validateUrl('ftp://domain.com'), expectedErrorMessage);
    });

    it('Should throw error if domain is localhost', () => {
      const expectedErrorMessage = 'localhost is an invalid hostname';
      expectErrorMessage(
        () => JiraService.validateUrl('http://localhost:8080'),
        expectedErrorMessage
      );
    });

    it('Should throw error if domain is 127.0.0.1', () => {
      const expectedErrorMessage = '127.0.0.1 is an invalid hostname';
      expectErrorMessage(
        () => JiraService.validateUrl('http://127.0.0.1:8080'),
        expectedErrorMessage
      );
    });

    it('Should throw error if url contains query parameters', () => {
      const expectedErrorMessage =
        'Url should be in the format {protocol}://{host}{path} (where path is optional). Did you mean to write "http://domain.com"?';
      expectErrorMessage(
        () => JiraService.validateUrl('http://domain.com?param=test'),
        expectedErrorMessage
      );
    });

    it('Should throw error if url contains username/password', () => {
      const expectedErrorMessage =
        'Url should be in the format {protocol}://{host}{path} (where path is optional). Did you mean to write "http://domain.com"?';
      expectErrorMessage(
        () => JiraService.validateUrl('http://user:pass@domain.com'),
        expectedErrorMessage
      );
    });

    it('Should throw error if url ends with a slash', () => {
      const expectedErrorMessage =
        'Url should be in the format {protocol}://{host}{path} (where path is optional). Did you mean to write "http://domain.com"?';
      expectErrorMessage(
        () => JiraService.validateUrl('http://user:pass@domain.com/'),
        expectedErrorMessage
      );
    });

    it('Should throw error if url path ends with a slash', () => {
      const expectedErrorMessage =
        'Url should be in the format {protocol}://{host}{path} (where path is optional). Did you mean to write "http://domain.com/test"?';
      expectErrorMessage(
        () => JiraService.validateUrl('http://user:pass@domain.com/test/'),
        expectedErrorMessage
      );
    });
  });
});
