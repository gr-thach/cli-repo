import axios from 'axios';
import lodashGet from 'lodash/get';
import { env } from '../../../config';
import { Repository } from '../../interfaces';

export const coreAxios = axios.create({
  baseURL: `${env.CORE_API_URI}`,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

export const wrapper = <Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>
) => async (...args: Args) => {
  // This is a hacky solution to fix an issue in Axios where Axios throws away the existing
  // stacktrace and creates a new one. So in order to capture some of the orginal stacktrace
  // we create a new error here and use that stack when throwing the error later.
  // See here for more info https://github.com/axios/axios/issues/2387.
  const error = new Error();

  try {
    return await fn(...args);
  } catch (e) {
    const err = e as any;
    if (err.isAxiosError) {
      err.stack = error.stack;
      if (lodashGet(e, 'response.data.validation')) {
        err.isCoreApiError = true;
      } else if (lodashGet(e, 'response.data.errors')) {
        err.isCoreApiGQLError = true;
      }
      throw e;
    } else {
      throw e;
    }
  }
};

export const parseNumberParams = (param: string, separator = ',') =>
  param.split(separator).map(Number);

export const parseStringParams = (param: string, separator = ',') =>
  param.split(separator).map(String);

export const gql = (literals: TemplateStringsArray, ...substitutions: string[]) => {
  let result = '';

  for (let i = 0; i < substitutions.length; i += 1) {
    result += literals[i];
    result += substitutions[i];
  }

  result += literals[literals.length - 1];

  return result;
};

export const formatRepository = (repository: any): Repository | undefined => {
  if (
    typeof repository === 'object' &&
    !Array.isArray(repository) &&
    repository !== null &&
    repository.idRepository
  ) {
    const { idMonorepoConfig, provider, ...rest } = repository;
    return {
      ...rest,
      provider: provider.toUpperCase(),
      isMonorepo: !!idMonorepoConfig
    };
  }
  return undefined;
};

export const formatRepositories = (repositories: any[]) =>
  repositories.map(formatRepository).filter(r => r !== undefined) as Repository[];
