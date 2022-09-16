"use strict";
const lodashGet = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const getQueuedScanStatusId = async () => {
    const query = gql `
    query {
      scanStatuses(first: 1, condition: { deletedAt: null, name: "queued" }) {
        nodes {
          idScanStatus
        }
      }
    }
  `;
    const { data } = await coreAxios.post('/graphql', { query });
    return lodashGet(data, 'data.scanStatuses.nodes[0].idScanStatus');
};
module.exports = {
    getQueuedScanStatusId: wrapper(getQueuedScanStatusId)
};
//# sourceMappingURL=scanStatus.js.map