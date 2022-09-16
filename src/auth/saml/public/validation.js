const boom = require('@hapi/boom');
const { isValidEmail } = require('../../../helpers/common');

const validateSamlOptions = samlOptions => {
  if (!samlOptions) {
    throw new Error('Saml options is not defined.');
  }

  if (!samlOptions.cert) {
    throw boom.badRequest('No certificate has been configured.');
  }

  if (!samlOptions.entryPoint) {
    throw boom.badRequest('No Identity provider single sign on URL has been configured.');
  }
};

const validateSamlUserCallback = samlUser => {
  if (!samlUser) {
    throw boom.badRequest('No saml user received in callback.');
  }

  const { nameID, email, nameIDFormat } = samlUser;

  if (!nameIDFormat) {
    throw boom.badRequest('Field nameIDFormat was not set in saml callback from saml provider.');
  }

  if (!nameIDFormat.includes('persistent')) {
    throw boom.badRequest('Field nameIDFormat in saml callback should be persistent.');
  }

  if (!nameID) {
    throw boom.badRequest('Field nameID was not set in saml callback from saml provider.');
  }

  if (typeof nameID !== 'string') {
    throw boom.badRequest(
      `Expected field nameID from the saml provider to be of type string, got: ${typeof nameID}.`
    );
  }

  if (nameID.length === 0) {
    throw boom.badRequest('Expected length of field nameID to be greater than 0.');
  }

  if (!email) {
    throw boom.badRequest(
      'Email attribute was not set in saml callback from saml provider. Please contact your saml administrator.'
    );
  }

  if (typeof email !== 'string') {
    throw boom.badRequest(
      `Expected email attribute from the saml provider to be of type string, got: ${typeof email}. Please contact your saml administrator.`
    );
  }

  if (email.length === 0) {
    throw boom.badRequest(
      'Expected length of email attribute to be greater than 0. Please contact your saml administrator.'
    );
  }

  if (!isValidEmail(email)) {
    throw boom.badRequest(
      `Email attribute from saml provider '${email}' is not a valid email. Please contact your saml administrator.`
    );
  }
};

const validateUser = user => {
  if (!user) {
    throw new Error('User was undefined.');
  }

  if (!user.provider) {
    throw new Error('No provider property was set on user.');
  }

  if (!user.providerAccessToken) {
    throw new Error('No providerAccessToken property was found on user.');
  }

  if (!user.login) {
    throw new Error('No login property was found on user.');
  }

  if (!user.providerInternalId) {
    throw new Error('No providerInternalId property was found on user.');
  }
};

module.exports = {
  validateSamlUserCallback,
  validateSamlOptions,
  validateUser
};
