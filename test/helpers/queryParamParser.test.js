import { parseNumberParams, parseStringParams } from '../../src/helpers/core-api/queryParamParser';

describe('QueryParamParser', () => {
  describe('parseNumberParams', () => {
    it('Should parse input string to array of number', () => {
      const expected = [1001, 1002];
      const actual = parseNumberParams('1001,1002');
      expect(expected).toEqual(actual);
    });
  });

  describe('parseStringParams', () => {
    it('Should parse input string to array of string', () => {
      const expected = ['1001', '1002'];
      const actual = parseStringParams('1001,1002');
      expect(expected).toEqual(actual);
    });
  });
});
