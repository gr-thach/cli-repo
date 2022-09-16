import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';

const {
  createSamlProvider,
  findSamlProviderById,
  updateSamlProvider,
  findSamlProviderByAccountId
} = require('../helpers/core-api/samlProviders');

const getByAccountId = async (req, res) => {
  const { account } = req;

  const samlProvider = await findSamlProviderByAccountId(account.idAccount);
  if (!samlProvider) {
    throw boom.notFound('No saml provider found on the account.');
  }

  return res.status(200).send({
    idSamlProvider: samlProvider.idSamlProvider,
    idAccount: samlProvider.fkAccount,
    entryPoint: samlProvider.entryPoint,
    cert: samlProvider.cert,
    enabled: samlProvider.enabled,
    contactEmail: samlProvider.contactEmail,
    gitProvider: account.provider
  });
};

const create = async (req, res) => {
  const {
    body: { enabled },
    account
  } = req;

  const existingSamlProvider = await findSamlProviderByAccountId(account.idAccount);
  if (existingSamlProvider) {
    throw boom.badRequest('A saml provider is already registered for the account.');
  }

  const newSamlProvider = await createSamlProvider({
    idSamlProvider: uuid(),
    fkAccount: account.idAccount,
    enabled: !!enabled,
    createdAt: new Date().toJSON()
  });

  return res.status(200).send({
    idSamlProvider: newSamlProvider.idSamlProvider,
    idAccount: newSamlProvider.fkAccount,
    entryPoint: newSamlProvider.entryPoint,
    cert: newSamlProvider.cert,
    contactEmail: newSamlProvider.contactEmail,
    enabled: newSamlProvider.enabled
  });
};

const patch = async (req, res) => {
  const {
    params: { idSamlProvider },
    body: { entryPoint, cert, enabled, contactEmail },
    account
  } = req;

  let samlProvider = await findSamlProviderById(idSamlProvider);
  if (!samlProvider) {
    throw boom.badRequest(`No saml provider found with the id ${idSamlProvider}.`);
  }

  if (samlProvider.fkAccount !== account.idAccount) {
    throw boom.badRequest(
      `The SAML provider with id ${idSamlProvider} doesn't belong to the account with id ${account.idAccount}`
    );
  }

  samlProvider = await updateSamlProvider(idSamlProvider, {
    entryPoint,
    cert,
    contactEmail,
    enabled
  });

  return res.status(200).send({
    idSamlProvider: samlProvider.idSamlProvider,
    idAccount: samlProvider.fkAccount,
    entryPoint: samlProvider.entryPoint,
    cert: samlProvider.cert,
    contactEmail: samlProvider.contactEmail,
    enabled: samlProvider.enabled
  });
};

module.exports = {
  getByAccountId,
  create,
  patch
};
