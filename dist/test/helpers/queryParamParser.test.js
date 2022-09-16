"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queryParamParser_1 = require("../../src/helpers/core-api/queryParamParser");
describe('QueryParamParser', () => {
    describe('parseNumberParams', () => {
        it('Should parse input string to array of number', () => {
            const expected = [1001, 1002];
            const actual = (0, queryParamParser_1.parseNumberParams)('1001,1002');
            expect(expected).toEqual(actual);
        });
    });
    describe('parseStringParams', () => {
        it('Should parse input string to array of string', () => {
            const expected = ['1001', '1002'];
            const actual = (0, queryParamParser_1.parseStringParams)('1001,1002');
            expect(expected).toEqual(actual);
        });
    });
});
//# sourceMappingURL=queryParamParser.test.js.map