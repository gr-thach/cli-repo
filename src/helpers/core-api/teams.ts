import { Team } from '../../interfaces';
import { coreAxios, wrapper } from './index';

export const queryTeams = wrapper(
  async (
    accountId: number,
    filters?: { search?: string; departmentId?: string },
    limit?: number,
    offset?: number
  ): Promise<{ teams: Team[]; totalCount: number }> => {
    const { data } = await coreAxios.get('/teams', {
      params: {
        ...filters,
        accountId,
        limit,
        offset
      }
    });

    return data;
  }
);

export const getImportedTeamIds = wrapper(
  async (
    accountId: number,
    provider: string
  ): Promise<Array<Pick<Team, 'idTeam' | 'providerInternalId'>>> => {
    const { data } = await coreAxios.post('/v2/teams/importedIds', {
      accountId,
      provider
    });

    return data;
  }
);

export const queryTeamsFilters = wrapper(
  async (accountId: number, filters?: { search?: string; departmentId?: string }) => {
    const { data } = await coreAxios.get('/teams/filters', {
      params: {
        ...filters,
        accountId
      }
    });

    return data;
  }
);

export const queryTeamById = wrapper(
  async (accountId: number, teamId: number): Promise<Team> => {
    const { data } = await coreAxios.get(`/teams/${teamId}`, {
      params: {
        accountId
      }
    });

    return data;
  }
);

type CreateTeam = Pick<Team, 'name' | 'department'> & Partial<Pick<Team, 'description'>>;

export const createTeam = wrapper(
  async (accountId: number, team: CreateTeam): Promise<Team> => {
    const { data } = await coreAxios.post('/teams', { team }, { params: { accountId } });
    return data;
  }
);

export const bulkCreateTeams = wrapper(
  async (
    teams: Array<Omit<Team, 'department' | 'idTeam'> & { createdAt: Date; updatedAt: Date }>
  ): Promise<{ teamIds: Pick<Team, 'idTeam' | 'providerInternalId'>[] }> => {
    const { data } = await coreAxios.post('/v2/teams/bulk', { teams });
    return data;
  }
);

export const bulkAddUsers = wrapper(
  async (
    teamsUsers: Array<{ fkUser: string; fkTeam: number; fkTeamRole: number }>
  ): Promise<{ addedUsers: number }> => {
    const { data } = await coreAxios.post('/v2/teams/users/bulk', { teamsUsers });
    return data;
  }
);

export const bulkAddRepositories = wrapper(
  async (
    teamsRepositories: Array<{ fkTeam: number; fkRepository: number }>
  ): Promise<{ addedRepositories: number }> => {
    const { data } = await coreAxios.post('/v2/teams/repositories/bulk', { teamsRepositories });
    return data;
  }
);

interface PatchTeam {
  name?: string;
  description?: string;
  department?: string;
}

export const updateTeam = wrapper(
  async (accountId: number, teamId: number | string, patch: PatchTeam): Promise<Team> => {
    const { data } = await coreAxios.patch(
      `/teams/${teamId}`,
      { patch },
      { params: { accountId } }
    );

    return data;
  }
);

export const destroyTeam = wrapper(async (accountId: number, teamId: number) => {
  const { data } = await coreAxios.delete(`/teams/${teamId}`, {
    params: {
      accountId
    }
  });

  return data;
});

export const addTeamApplications = wrapper(
  async (accountId: number, teamId: number, applicationIds: number[]) => {
    const { data } = await coreAxios.post(
      `/teams/${teamId}/applications`,
      { applicationIds },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const putTeamApplications = wrapper(
  async (accountId: number, teamId: number, applicationIds: number[]) => {
    const { data } = await coreAxios.put(
      `/teams/${teamId}/applications`,
      { applicationIds },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const removeTeamApplications = wrapper(
  async (accountId: number, teamId: number, applicationIds: number[]) => {
    const { data } = await coreAxios.delete(`/teams/${teamId}/applications`, {
      data: { applicationIds },
      params: {
        accountId
      }
    });

    return data;
  }
);

export const addTeamRepositories = wrapper(
  async (accountId: number, teamId: number, repositoryIds: number[]) => {
    const { data } = await coreAxios.post(
      `/teams/${teamId}/repositories`,
      { repositoryIds },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const putTeamRepositories = wrapper(
  async (accountId: number, teamId: number, repositoryIds: number[]) => {
    const { data } = await coreAxios.put(
      `/teams/${teamId}/repositories`,
      { repositoryIds },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const removeTeamRepositories = wrapper(
  async (accountId: number, teamId: number, repositoryIds: number[]) => {
    const { data } = await coreAxios.delete(`/teams/${teamId}/repositories`, {
      data: { repositoryIds },
      params: {
        accountId
      }
    });

    return data;
  }
);

interface UserWithRole {
  userId: string;
  teamRoleId: number;
}

export const addTeamUsers = wrapper(
  async (accountId: number, teamId: number, users: UserWithRole[]) => {
    const { data } = await coreAxios.post(
      `/teams/${teamId}/users`,
      { users },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const putTeamUsers = wrapper(
  async (accountId: number, teamId: number, users: UserWithRole[]) => {
    const { data } = await coreAxios.put(
      `/teams/${teamId}/users`,
      { users },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const updateTeamUsersRoles = wrapper(
  async (accountId: number, teamId: number, users: UserWithRole[]) => {
    const { data } = await coreAxios.patch(
      `/teams/${teamId}/users`,
      { users },
      {
        params: {
          accountId
        }
      }
    );

    return data;
  }
);

export const removeTeamUsers = wrapper(
  async (accountId: number, teamId: number, userIds: number[]) => {
    const { data } = await coreAxios.delete(`/teams/${teamId}/users`, {
      data: { userIds },
      params: {
        accountId
      }
    });

    return data;
  }
);
