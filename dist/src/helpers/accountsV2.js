"use strict";
// NOTE: This is a new account's helper that will slowly replace the previous account
// helper class with too many things we won't need
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAccountsByAllowedAccounts = void 0;
const filterAccountsByAllowedAccounts = (accounts, allowedAccounts = null) => {
    const filteredAccounts = allowedAccounts
        ? accounts.filter(account => Object.keys(allowedAccounts).includes(String(account.idAccount)))
        : accounts;
    if (filteredAccounts.length === 0) {
        return undefined;
    }
    if (filteredAccounts.length === 1 || !allowedAccounts) {
        return filteredAccounts[0];
    }
    throw new Error('Found multiple accounts with the same identifier for the same provider.');
};
exports.filterAccountsByAllowedAccounts = filterAccountsByAllowedAccounts;
//# sourceMappingURL=accountsV2.js.map