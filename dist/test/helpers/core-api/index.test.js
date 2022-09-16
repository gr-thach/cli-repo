"use strict";
/* eslint-disable global-require */
const { gql } = require('../../../src/helpers/core-api/index');
describe('Parse gql', () => {
    it('should return correctly', async () => {
        const expected = `
      query($idAccount: Int, $idRepository: Int) {
        repositories(condition: { fkAccount: $idAccount, idRepository: $idRepository }) {
          nodes {
            idRepository
          }
        }
      }
      
      fragment RepositoryFragment on Repository {
        idRepository
        name
      }
    
    `;
        const fragment = gql `
      fragment RepositoryFragment on Repository {
        idRepository
        name
      }
    `;
        const actual = gql `
      query($idAccount: Int, $idRepository: Int) {
        repositories(condition: { fkAccount: $idAccount, idRepository: $idRepository }) {
          nodes {
            idRepository
          }
        }
      }
      ${fragment}
    `;
        expect(actual).toEqual(expected);
    });
});
//# sourceMappingURL=index.test.js.map