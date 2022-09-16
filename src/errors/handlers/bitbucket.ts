import { UserRoleName } from '../../interfaces';
import BitbucketError from '../bitbucketError';

export const bitbucketDefaultErrorHandler = (err: any, functionName: string) => {
  throw new BitbucketError(
    err.error?.error?.message || err.message,
    functionName,
    err.status,
    err.request?.method,
    err.request?.url
  );
};

export const bitbucketGetUserRoleErrorHandler = (err: any) => {
  // eslint-disable-next-line no-console
  console.error(
    `BitbucketDataCenterError when trying to retrieve the user's role: ${err.message}`,
    { error: err }
  );
  return UserRoleName.DEVELOPER;
};
