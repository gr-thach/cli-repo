import { AxiosError } from 'axios';
import boom from '@hapi/boom';
import lodashGet from 'lodash/get';
import lodashSnakeCase from 'lodash/snakeCase';
import crypto from 'crypto';
import { validate as isValidUUID } from 'uuid';
import { env, constants } from '../../config';
import { BaseAccount, GitProvider } from '../interfaces';

export const EMAIL_REGEXP = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const getAccountIdentifier = (provider: GitProvider) => {
  switch (provider.toUpperCase()) {
    case GitProvider.BITBUCKET_DATA_CENTER:
      return 'providerMetadata.projectKey';
    default:
      return 'login';
  }
};

export const getAccountIdentifierValue = (account: BaseAccount) => {
  return lodashGet(account, getAccountIdentifier(account.provider), account.login);
};

export const shortGitProvider = (provider: GitProvider) => {
  switch (provider.toUpperCase()) {
    case GitProvider.GITHUB:
      return 'gh';
    case GitProvider.GITLAB:
      return 'gl';
    case GitProvider.BITBUCKET:
      return 'bb';
    case GitProvider.BITBUCKET_DATA_CENTER:
      return 'bbdc';
    default:
      throw Error('invalid provider');
  }
};

export const constructAccountPIDUrl = (account: BaseAccount) => {
  const accountIdentifier = getAccountIdentifierValue(account);
  return `${shortGitProvider(account.provider)}/${accountIdentifier}`;
};

export const linkToCode = (
  account: BaseAccount,
  repositoryName: string,
  codePath: string,
  codeLineNumber: number,
  sha: string
) => {
  const { provider } = account;
  const accountIdentifier = getAccountIdentifierValue(account);

  switch (provider.toUpperCase()) {
    case GitProvider.GITHUB:
      return `${env.GITHUB_URL}/${decodeURIComponent(
        accountIdentifier
      )}/${repositoryName}/blob/${sha}/${codePath}${codeLineNumber ? `#L${codeLineNumber}` : ''}`;
    case GitProvider.GITLAB:
      return `${env.GITLAB_URL}/${decodeURIComponent(
        accountIdentifier
      )}/${repositoryName}/blob/${sha}/${codePath}${codeLineNumber ? `#L${codeLineNumber}` : ''}`;
    case GitProvider.BITBUCKET:
      return `${env.BITBUCKET_SITE_URL}/${decodeURIComponent(
        accountIdentifier
      )}/${repositoryName}/src/${sha}/${codePath}${
        codeLineNumber ? `#lines-${codeLineNumber}` : ''
      }`;
    case GitProvider.BITBUCKET_DATA_CENTER:
      return `${env.BITBUCKET_DATA_CENTER_SITE_URL}/projects/${decodeURIComponent(
        accountIdentifier
      )}/repos/${repositoryName}/browse/${codePath}?at=${sha}${
        codeLineNumber ? `#${codeLineNumber}` : ''
      }`;
    default:
      throw Error(`Invalid git provider '${provider}'`);
  }
};

export const linkToScan = (account: BaseAccount, idRepository: number, sha: string) => {
  const pid = constructAccountPIDUrl(account);
  return `${constants.dashboardBaseUrl}/${pid}/repos/${idRepository}/scans?sha=${sha}`;
};

// returns the domain and port
export const corsOrigin = () => {
  if (env.DISABLE_CORS) return false;
  return [constants.dashboardBaseUrl];
};

// returns the domain only
export const getDomain = () => {
  // we use the api external url to obtain the domain where the cookie can be set to
  if (env.API_EXTERNAL_URL.includes('://')) {
    return env.API_EXTERNAL_URL.split(':')[1].replace('//', '');
  }

  throw new Error(
    'Invalid API_EXTERNAL_URL, it must be a valid url including protocol, i.e.: https://api.example.com'
  );
};

export const isValidEmail = (email: string) => {
  return EMAIL_REGEXP.test(email);
};

const algorithm = 'aes-256-cbc';

export const aesEncrypt = (text: string, secret: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}|${encrypted.toString('hex')}`;
};

export const aesDecrypt = (text: string, secret: string) => {
  const [iv, encryptedData] = text.split('|');
  const ivBuffer = Buffer.from(iv, 'hex');
  const encryptedText = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, ivBuffer);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const base64Decode = (data: string) => {
  return Buffer.from(data, 'base64').toString('ascii');
};

const jsonStringifyIfNotString = (data: object | string | null | undefined) => {
  if (typeof data === 'string' || data === null || data === undefined) {
    return data;
  }

  return JSON.stringify(data, null, 2);
};

const truncateString = (str: string | null | undefined, maxLength: number) => {
  if (str && typeof str === 'string' && str.length > maxLength) {
    return `${str.substring(0, maxLength)}...`;
  }

  return str;
};

export const getContextFromAxiosError = (axiosError: AxiosError) => {
  const context: { request?: {}; response?: {} } = {};
  const { config, response } = axiosError;

  if (config) {
    let body = jsonStringifyIfNotString(config.data);
    body = truncateString(body, 3000);

    context.request = {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      body
    };
  }

  if (response) {
    const { status, data } = response;

    let body = jsonStringifyIfNotString(data);
    body = truncateString(body, 3000);

    context.response = {
      status,
      body
    };
  }

  return context;
};

export const parseOrderByToGraphQL = (orderByParam: string | null | undefined) => {
  if (!orderByParam) {
    return undefined;
  }

  const [columnRaw, orderRaw] = orderByParam.split(',');
  const column = columnRaw.trim();
  const order = orderRaw.trim().toUpperCase();

  if (!['ASC', 'DESC'].includes(order)) {
    throw boom.badRequest('Invalid orderBy. Direction must be ASC or DESC');
  }

  return `${lodashSnakeCase(column).toUpperCase()}_${order}`;
};

export const parseListParam = (param: string | null | undefined) => {
  return param ? param.split(',') : undefined;
};

export const parseListParams = (params: { [key: string]: string | null | undefined }) => {
  const parsed: { [key: string]: string[] | undefined } = {};
  Object.keys(params).forEach(key => {
    parsed[key] = parseListParam(params[key]);
  });
  return parsed;
};

export const toArray = <T>(arrOrElem: T | T[] | undefined) => {
  if (arrOrElem === undefined) {
    return [];
  }
  return Array.isArray(arrOrElem) ? arrOrElem : [arrOrElem];
};

export const validateUUIDParams = (fieldsKeyValuePairs: { [key: string]: string } = {}) => {
  const invalidFields: string[] = [];
  Object.keys(fieldsKeyValuePairs).forEach(key => {
    if (!fieldsKeyValuePairs[key] || !isValidUUID(fieldsKeyValuePairs[key])) {
      invalidFields.push(key);
    }
  });

  if (invalidFields.length) {
    throw boom.badRequest(`The parameters [${invalidFields.join(', ')}] should be a valid UUID`);
  }
};
