"use strict";
const assertIsValidPaginationResponse = data => {
    if (typeof data.pagelen !== 'number') {
        throw new Error(`Expected 'pagelen' in pagination response to be of type number, got ${typeof data.pagelen}. Is this really a paginated resource?`);
    }
    if (typeof data.page !== 'number') {
        throw new Error(`Expected 'page' in pagination response to be of type number, got ${typeof data.page}. Is this really a paginated resource?`);
    }
    if (!Array.isArray(data.values)) {
        throw new Error(`Expected 'values' in pagination response to be an array, got ${JSON.stringify(data.values, null, 2)}. Is this really a paginated resource?`);
    }
    if (data.next && typeof data.next !== 'string') {
        throw new Error(`Expected 'next' in pagination response to be of type string, got ${typeof data.next}. Is this really a paginated resource?`);
    }
};
module.exports = {
    assertIsValidPaginationResponse
};
//# sourceMappingURL=assertBitbucket.js.map