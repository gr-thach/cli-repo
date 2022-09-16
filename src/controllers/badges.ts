import { Request, Response } from 'express';
import { findRepositoryForBadges } from '../helpers/core-api/repositories';
import { GitProvider } from '../interfaces';

const baseUri = 'https://img.shields.io/badge/GuardRails';
const responses = {
  notInstalled: `${baseUri}-not%20installed-lightgray.svg`,
  disabled: `${baseUri}-disabled-lightgray.svg`,
  enabled: `${baseUri}-enabled-brightgreen.svg`
};

export const get = async (req: Request, res: Response) => {
  const {
    params: { accountIdentifier, repoName },
    query: { token = '', provider = 'github' }
  } = req;
  // using redirect variable to avoid setting headers until we return the response (in case we have an error)
  let redirect = responses.notInstalled;

  const repository = await findRepositoryForBadges(
    repoName,
    accountIdentifier,
    provider as GitProvider
  );
  if (repository) {
    const { isPrivate, badgeToken, isEnabled } = repository;
    if (!isEnabled) {
      redirect = responses.disabled;
    } else if (!isPrivate || (token && badgeToken === token)) {
      redirect = responses.enabled;
    }
  }
  res.setHeader('content-type', 'image/svg+xml');
  return res.redirect(redirect);
};
