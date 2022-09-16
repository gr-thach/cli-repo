import { coreAxios, wrapper } from './index';

export const queryDepartments = wrapper(async (accountId: number) => {
  const { data } = await coreAxios.get('/departments', {
    params: {
      accountId
    }
  });

  return data;
});

export const createDepartments = wrapper(
  async (accountId: number, department: { name: string }) => {
    const { data } = await coreAxios.post(
      '/departments',
      { department },
      { params: { accountId } }
    );

    return data;
  }
);
