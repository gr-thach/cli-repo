import { Application } from '../../interfaces';
import { coreAxios, wrapper } from './index';

export const queryApplications = wrapper(
  async (
    accountId: number,
    filters?: { teamId?: string; search?: string },
    limit?: number,
    offset?: number
  ) => {
    const { data } = await coreAxios.get('/applications', {
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

export const queryApplicationsFilters = wrapper(
  async (
    accountId: number,
    filters?: { teamId?: string; search?: string },
    limit?: number,
    offset?: number
  ) => {
    const { data } = await coreAxios.get('/applications/filters', {
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

export const queryApplicationById = wrapper(async (accountId: number, applicationId: number) => {
  const { data } = await coreAxios.get(`/applications/${applicationId}`, {
    params: {
      accountId
    }
  });

  return data;
});

type CreateApplication = Pick<Application, 'name'> & Partial<Pick<Application, 'description'>>;

export const createApplication = wrapper(
  async (accountId: number, application: CreateApplication) => {
    const { data } = await coreAxios.post(
      '/applications',
      { application },
      { params: { accountId } }
    );

    return data;
  }
);
