import boom from '@hapi/boom';
import { RequestUser, User, UserTeamIdsByTeamRole } from '../interfaces';
import {
  findUserWithRoleByProviderInternalId,
  queryUserTeamsOnUserAccount
} from './core-api/users';

export const parseUser = (user: RequestUser) => {
  const {
    provider,
    githubNickname,
    gitlabNickname,
    bitbucketNickname,
    bitbucketDataCenterNickname,
    githubAccessToken,
    gitlabAccessToken,
    bitbucketAccessToken,
    bitbucketDataCenterAccessToken,
    bitbucketDataCenterAccessTokenSecret
  } = user;
  switch (provider) {
    case 'github':
      return { provider, login: githubNickname!, accessToken: githubAccessToken! };
    case 'gitlab':
      return { provider, login: gitlabNickname!, accessToken: gitlabAccessToken! };
    case 'bitbucket':
      return { provider, login: bitbucketNickname!, accessToken: bitbucketAccessToken! };
    case 'bitbucket_data_center':
      return {
        provider,
        login: bitbucketDataCenterNickname!,
        accessToken: bitbucketDataCenterAccessToken!,
        accessTokenSecret: bitbucketDataCenterAccessTokenSecret!
      };
    default:
      throw boom.badRequest('Invalid user provider');
  }
};

export const getUserTeamIdsByTeamRoleOnAccount = async (
  accountId: number,
  userId: string
): Promise<UserTeamIdsByTeamRole> => {
  const teams = await queryUserTeamsOnUserAccount(accountId, userId);

  return teams.reduce((acc, team) => {
    const role = team.teamRole.name || 'not_part_of_the_team';
    acc[role] = acc[role] || [];
    acc[role].push(team.idTeam);
    return acc;
  }, {} as UserTeamIdsByTeamRole);
};

export const getUserInDbForAccount = async (
  user: RequestUser,
  accountId: number
): Promise<Pick<User, 'idUser' | 'role'> | undefined> => {
  const userInDb = await findUserWithRoleByProviderInternalId(
    user.providerInternalId,
    user.provider,
    accountId
  );

  if (userInDb) {
    return { idUser: userInDb.idUser, role: userInDb.role };
  }

  return undefined;
};
