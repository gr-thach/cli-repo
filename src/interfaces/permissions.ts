import { PermissionsRoleName } from './roles';

export enum Resource {
  // INSIGHTS = 'INSIGHTS',
  // CUSTOM_CONFIG = 'CUSTOM_CONFIG',
  // SSO = 'SSO',
  // CUSTOM_ENGINES = 'CUSTOM_ENGINES',
  // REPOSITORIES = 'REPOSITORIES',
  // VULNERABILITIES = 'VULNERABILITIES'
  API = 'API',
  APPLICATIONS = 'Applications',
  ACCOUNTS = 'Accounts',
  ACTIONS = 'Actions',
  CLI = 'CLI',
  CUSTOM_ENGINES = 'CustomEngines',
  ENGINES = 'Engines',
  CUSTOM_CONFIG = 'EnginesConfig',
  FINDINGS = 'Findings',
  JIRA = 'Jira',
  JIRA_CONFIG = 'JiraConfig',
  PREHOOKS = 'Prehooks',
  REPORTS = 'Reports',
  REPOSITORIES = 'Repositories',
  RULES = 'Rules',
  SAML = 'Saml',
  SCANS = 'Scans',
  STATS = 'Stats',
  SUBSCRIPTION = 'Subscription',
  TEAMS = 'Teams',
  USERS = 'Users',
  USER_EVENTS = 'UserEvents'
}

export enum PermissionAction {
  READ = 'read',
  WRITE = 'write'
}

export interface PermissionsPolicy {
  idPermission: number;
  fkAccount: number;
  plans: string[];
  role: PermissionsRoleName;
  resource: Resource;
  actions: string[];
  createdAt: string;
  updatedAt: string;
}
