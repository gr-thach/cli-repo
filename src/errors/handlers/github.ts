import GithubError from '../githubError';

export const githubDefaultErrorHandler = (err: any, functionName: string) => {
  throw new GithubError(
    err.message,
    functionName,
    err.status,
    err.request?.method,
    err.request?.url,
    err.documentation_url
  );
};
