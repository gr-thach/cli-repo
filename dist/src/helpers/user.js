"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInDbForAccount = exports.getUserTeamIdsByTeamRoleOnAccount = exports.parseUser = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const users_1 = require("./core-api/users");
const parseUser = (user) => {
    const { provider, githubNickname, gitlabNickname, bitbucketNickname, bitbucketDataCenterNickname, githubAccessToken, gitlabAccessToken, bitbucketAccessToken, bitbucketDataCenterAccessToken, bitbucketDataCenterAccessTokenSecret } = user;
    switch (provider) {
        case 'github':
            return { provider, login: githubNickname, accessToken: githubAccessToken };
        case 'gitlab':
            return { provider, login: gitlabNickname, accessToken: gitlabAccessToken };
        case 'bitbucket':
            return { provider, login: bitbucketNickname, accessToken: bitbucketAccessToken };
        case 'bitbucket_data_center':
            return {
                provider,
                login: bitbucketDataCenterNickname,
                accessToken: bitbucketDataCenterAccessToken,
                accessTokenSecret: bitbucketDataCenterAccessTokenSecret
            };
        default:
            throw boom_1.default.badRequest('Invalid user provider');
    }
};
exports.parseUser = parseUser;
const getUserTeamIdsByTeamRoleOnAccount = async (accountId, userId) => {
    const teams = await (0, users_1.queryUserTeamsOnUserAccount)(accountId, userId);
    return teams.reduce((acc, team) => {
        const role = team.teamRole.name || 'not_part_of_the_team';
        acc[role] = acc[role] || [];
        acc[role].push(team.idTeam);
        return acc;
    }, {});
};
exports.getUserTeamIdsByTeamRoleOnAccount = getUserTeamIdsByTeamRoleOnAccount;
const getUserInDbForAccount = async (user, accountId) => {
    const userInDb = await (0, users_1.findUserWithRoleByProviderInternalId)(user.providerInternalId, user.provider, accountId);
    if (userInDb) {
        return { idUser: userInDb.idUser, role: userInDb.role };
    }
    return undefined;
};
exports.getUserInDbForAccount = getUserInDbForAccount;
//# sourceMappingURL=user.js.map