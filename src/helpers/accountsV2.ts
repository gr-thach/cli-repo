// NOTE: This is a new account's helper that will slowly replace the previous account
// helper class with too many things we won't need

import { AllowedAccounts, BaseAccount } from '../interfaces';

export const filterAccountsByAllowedAccounts = <T extends BaseAccount>(
  accounts: T[],
  allowedAccounts: AllowedAccounts | null = null
): T | undefined => {
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
