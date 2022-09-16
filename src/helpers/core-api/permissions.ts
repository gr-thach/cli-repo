import {
  PlanCode,
  Resource,
  PermissionsRoleName,
  SpecialPlanCode,
  PermissionAction
} from '../../interfaces';
import { coreAxios, wrapper } from './index';

export const getPermissionPolicies = wrapper(
  async (
    accountId: number | string,
    planCode: PlanCode | SpecialPlanCode,
    roles: PermissionsRoleName[],
    resources: Resource[],
    action: PermissionAction
  ) => {
    const { data } = await coreAxios.get('/permissions', {
      params: { accountId, planCode, roles, resources, action }
    });
    return data;
  }
);

export const createPolicyForAccounts = wrapper(async (accountIds: (number | string)[]) => {
  const { data } = await coreAxios.post('/permissions/createPolicyForAccounts', {
    accountIds
  });

  return data;
});
