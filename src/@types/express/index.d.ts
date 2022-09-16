/* eslint-disable no-unused-vars */
import { Account, RequestUser, User } from '../../interfaces';
import PermissionService from '../../services/permissions/permission';
import TeamPermissionService from '../../services/permissions/teamPermission';

declare module 'express-serve-static-core' {
  interface Request {
    user: RequestUser;
    account?: Account;
    userInDb?: User;
    permission?: PermissionService;
    teamPermission?: TeamPermissionService;
    rawBody: string | Buffer;
  }
}
