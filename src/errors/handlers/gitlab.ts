import { UserRoleName } from '../../interfaces';
import GitlabError from '../gitlabError';

export const gitlabDefaultErrorHandler = (err: any, functionName: string) => {
  throw new GitlabError(
    err.description || err.message,
    functionName,
    err.response?.statusCode,
    err.request?.options?.method,
    err.request?.requestUrl
  );
};

export const gitlabGetUserRoleErrorHandler = (err: any) => {
  // A 404 can happen if a Gitlab user is not a member of a Gitlab group.
  // A user can have access to a repository inside a Gitlab group, but not being a member of that Gitlab group.
  // So if a user is not a member of a group, then we fall back to developer role.
  if (err.response && err.response.statusCode === 404) {
    if (err.description) {
      let errDescription = `GitLabError when trying to retrieve the user's role: ${err.description}`;
      if (err.request && err.request.options) {
        errDescription += ` over ${err.request.options.method} / ${err.request.requestUrl}`;
      }
      // eslint-disable-next-line no-console
      console.error(errDescription);
    }
    return UserRoleName.DEVELOPER;
  }
  return gitlabDefaultErrorHandler(err, 'getUserRole');
};
