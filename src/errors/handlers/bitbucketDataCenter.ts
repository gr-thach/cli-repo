import { UserRoleName } from '../../interfaces';
import BitbucketDataCenterError from '../bitbucketDataCenterError';

export const bitbucketDataCenterDefaultErrorHandler = (err: any, functionName: string) => {
  throw new BitbucketDataCenterError(
    err.description || err.message,
    functionName,
    err.response?.status,
    err.config?.method,
    err.config?.url
  );
};

export const bitbucketDataCenterGetDefaultBranchRoleErrorHandler = (err: any) => {
  if (err.response && err.response.status === 404) {
    return undefined;
  }
  return bitbucketDataCenterDefaultErrorHandler(err, 'getDefaultBranch');
};

export const bitbucketDataCenterGetUserRoleErrorHandler = (err: any) => {
  if (err.response && err.response.status === 401) {
    // eslint-disable-next-line no-console
    console.error(
      `BitbucketDataCenterError when trying to retrieve the user's role: ${err.message}`
    );
    return UserRoleName.DEVELOPER;
  }
  return bitbucketDataCenterDefaultErrorHandler(err, 'getUserRole');
};
