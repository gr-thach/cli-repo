const { coreAxios, wrapper } = require('./index');

export const uniqueUsersInPeriod = wrapper(
  async (accountId: number, periodStart: string, periodEnd: string) => {
    const { data } = await coreAxios.get(`/userEvents/${accountId}/uniqueUsersInPeriod`, {
      params: { periodStart, periodEnd }
    });
    return data;
  }
);
