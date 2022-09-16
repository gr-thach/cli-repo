import get from 'lodash/get';
import { TeamRole, UserRole } from '../../interfaces';
import { coreAxios, wrapper, gql } from './index';

export const findAllRoles = wrapper(
  async (): Promise<UserRole[]> => {
    const query = gql`
      query {
        roles(orderBy: ID_ROLE_ASC, condition: { deletedAt: null }) {
          nodes {
            idRole
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `;
    const { data } = await coreAxios.post('/graphql', { query });
    return get(data, 'data.roles.nodes');
  }
);

export const findAllTeamRoles = wrapper(
  async (): Promise<TeamRole[]> => {
    const query = gql`
      query {
        teamRoles(orderBy: ID_TEAM_ROLE_ASC, condition: { deletedAt: null }) {
          nodes {
            idTeamRole
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `;
    const { data } = await coreAxios.post('/graphql', { query });
    return get(data, 'data.teamRoles.nodes');
  }
);
