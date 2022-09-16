"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const acl_1 = require("../helpers/acl");
const { findSamlProviderById } = require('../helpers/core-api/samlProviders');
const { findSamlUserById, updateSamlUser } = require('../helpers/core-api/samlUsers');
const { findBaseAccountById } = require('../helpers/core-api/accounts');
const { findUserByProviderInternalId } = require('../helpers/core-api/users');
const get = async (req, res) => {
    const { idSamlUser, fkSamlProvider } = req.samlUser;
    const samlUser = await findSamlUserById(idSamlUser);
    if (!samlUser) {
        throw new Error(`Expected to find saml user in database but none was found with id ${idSamlUser}.`);
    }
    const samlProvider = await findSamlProviderById(fkSamlProvider);
    if (!samlProvider) {
        throw new Error(`Expected to find saml provider in database but none was found with id ${fkSamlProvider}.`);
    }
    const account = await findBaseAccountById(samlProvider.fkAccount);
    if (!account) {
        throw new Error(`Expected to find a account connected to saml provider in database but none was found with id ${samlProvider.fkAccount}.`);
    }
    return res.status(200).send({
        idSamlUser: samlUser.idSamlUser,
        idUser: samlUser.fkUser,
        email: samlUser.email
    });
};
const getSamlProvider = async (req, res) => {
    const { fkSamlProvider } = req.samlUser;
    const samlProvider = await findSamlProviderById(fkSamlProvider);
    if (!samlProvider) {
        throw new Error(`Expected to find saml provider in database but none was found with id ${fkSamlProvider}.`);
    }
    const account = await findBaseAccountById(samlProvider.fkAccount);
    if (!account) {
        throw new Error(`Expected to find a account connected to saml provider in database but none was found with id ${samlProvider.fkAccount}.`);
    }
    return res.status(200).send({
        idSamlProvider: samlProvider.idSamlProvider,
        idAccount: samlProvider.fkAccount,
        entryPoint: samlProvider.entryPoint,
        cert: samlProvider.cert,
        enabled: samlProvider.enabled,
        gitProvider: account.provider
    });
};
const linkUser = async (req, res) => {
    const { idSamlUser, fkSamlProvider } = req.samlUser;
    const { user } = req;
    const samlProvider = await findSamlProviderById(fkSamlProvider);
    if (!samlProvider) {
        throw new Error(`Expected to find saml provider in database but none was found with id ${fkSamlProvider}.`);
    }
    const { allowedAccounts } = await (0, acl_1.getAllowedAccountsByUser)(user);
    if (!allowedAccounts[samlProvider.fkAccount]) {
        throw boom_1.default.badRequest('You are not allowed to link a git account that is not a member of the organization that the saml provider is connected to.');
    }
    const account = await findBaseAccountById(samlProvider.fkAccount);
    if (!account) {
        throw new Error(`Expected to find a account connected to saml provider in database but none was found with id ${samlProvider.fkAccount}.`);
    }
    const userInDb = await findUserByProviderInternalId(user.providerInternalId, user.provider);
    if (!userInDb) {
        throw new Error(`Expected to find user in database but none was found with internal id '${user.providerInternalId}' and git provider '${user.provider}'.`);
    }
    await updateSamlUser(idSamlUser, {
        fkUser: userInDb.idUser
    });
    return res.status(204).send();
};
const unlinkUser = async (req, res) => {
    const { idSamlUser } = req.samlUser;
    await updateSamlUser(idSamlUser, {
        fkUser: null
    });
    // Logout the user when the "git user" has been unlinked from the saml account.
    req.session.jwt = undefined;
    return res.status(204).send();
};
module.exports = {
    get,
    getSamlProvider,
    linkUser,
    unlinkUser
};
//# sourceMappingURL=samlUser.js.map