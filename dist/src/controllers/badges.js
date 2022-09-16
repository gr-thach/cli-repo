"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const repositories_1 = require("../helpers/core-api/repositories");
const baseUri = 'https://img.shields.io/badge/GuardRails';
const responses = {
    notInstalled: `${baseUri}-not%20installed-lightgray.svg`,
    disabled: `${baseUri}-disabled-lightgray.svg`,
    enabled: `${baseUri}-enabled-brightgreen.svg`
};
const get = async (req, res) => {
    const { params: { accountIdentifier, repoName }, query: { token = '', provider = 'github' } } = req;
    // using redirect variable to avoid setting headers until we return the response (in case we have an error)
    let redirect = responses.notInstalled;
    const repository = await (0, repositories_1.findRepositoryForBadges)(repoName, accountIdentifier, provider);
    if (repository) {
        const { isPrivate, badgeToken, isEnabled } = repository;
        if (!isEnabled) {
            redirect = responses.disabled;
        }
        else if (!isPrivate || (token && badgeToken === token)) {
            redirect = responses.enabled;
        }
    }
    res.setHeader('content-type', 'image/svg+xml');
    return res.redirect(redirect);
};
exports.get = get;
//# sourceMappingURL=badges.js.map