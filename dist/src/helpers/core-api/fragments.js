"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.engineAccountConfigFragment = exports.jiraIssueFragment = exports.jiraRepositoryConfigFragment = exports.jiraIntegrationConfigFragment = exports.actionFragment = exports.samlUserFragment = exports.samlProviderFragment = exports.findingFragment = exports.userFragment = exports.subscriptionChangelogFragment = exports.scanFragment = exports.reportFragment = exports.grPlanFragment = exports.repositoryFragment = exports.accountFragment = void 0;
const accountFields = `
  idAccount
  fkParentAccount
  login
  type
  provider
  providerInternalId
  installationId
  cliToken
  filterReposByWriteAccess
  configuration
  providerMetadata
  usersSynchronized
  createdAt
  updatedAt
  deletedAt
`;
const repositoryFields = `
  idRepository
  fkAccount
  name
  defaultBranch
  provider
  providerInternalId
  badgeToken
  isPrivate
  isEnabled
  configuration
  createdAt
  updatedAt
  fullName
  description
  language
`;
const grPlanFields = `
  idPlan
  name
  code
  description
  bullets
  queuePriority
  createdAt
  updatedAt
`;
const reportFields = `
  idReport
  fkAccount
  fkRepository
  status
  type
  sha
  metadata
  enginesOutputs
  vulnerabilitiesByGrId
  isPublic
  hasComment
  commentId
  prNumber
  queuedAt
  scanningAt
  finishedAt
  createdAt
  updatedAt
`;
const scanFields = `
  idScan
  type
  branch
  sha
  githookMetadata
  totalVulnerabilities
  newVulnerabilities
  queuedAt
  scanningAt
  finishedAt
  prNumber
  updatedAt
  status: scanStatusByFkScanStatus {
    idScanStatus
    name
  }
  result: scanResultByFkScanResult {
    idScanResult
    name
  }
  isParanoid
`;
const subscriptionChangelogFields = `
  idSubscriptionChangelog
  subscriptionStatus
  subscriptionEvent
  subscriptionInterval
  createdAt
  plan: grPlanByFkPlan{
    idPlan
    name
    code
  }
  user: userByFkUser{
    login
  }
`;
const userFields = `
  idUser
  login
  provider
  providerInternalId
  providerAccessToken
  providerAccessTokenSecret
  providerRefreshToken
  providerMetadata
  apiKey
  name
  email
  avatarUrl
  acl
  createdAt
  updatedAt
`;
const samlProviderFields = `
  idSamlProvider
  fkAccount
  entryPoint
  cert
  enabled
  contactEmail
`;
const samlUser = `
  idSamlUser
  fkSamlProvider
  fkUser
  email
`;
const findingFields = `
  idFinding
  fkRepository
  repository: repositoryByFkRepository {
    idRepository
    name
    fkAccount
  }
  branch
  language
  type
  status
  path
  lineNumber
  lineContent
  score
  metadata
  ticketLink
  introducedBy
  introducedAt
  fixedAt
  fixedBy
  createdAt
  fkEngineRule
  fkRule
  rule: ruleByFkRule {
    idRule
    name
    title
    docs
  }
  severity: severityByFkSeverity {
    idSeverity
    name
  }
`;
const actionFields = `
  idAction
  action
  path
  lineNumber
  lineContent
  dependencyName
  dependencyVersion
  transitiveDependency
  rule: ruleByFkRule {
    idRule
    name
    title
  }
  engineRule: engineRuleByFkEngineRule {
    idEngineRule
    name
  }
  repository: repositoryByFkRepository {
    idRepository
    name
  }
  account: accountByFkAccount {
    idAccount
    login
  }
`;
const jiraIntegrationConfigFields = `
  idJiraIntegrationConfig
  idAccount: fkAccount
  webUrl
  apiUrl
  username
  password
  deletedAt
`;
const jiraRepositoryConfigFields = `
  idJiraRepositoryConfig
  idJiraIntegrationConfig: fkJiraIntegrationConfig
  idRepository: fkRepository
  externalProjectId
  externalIssueTypeId
  deletedAt
`;
const jiraIssueFields = `
  idJiraIssue
  idFinding: fkFinding
  externalId
  externalKey
`;
const engineAccountConfigFields = `
  idEngineConfig: idEngineAccountConfig
  specId: fkEngineConfigSpec
  spec: engineConfigSpecByFkEngineConfigSpec {
    format: validator
    validation
  }
  envVars
  rules
  engine: engineByFkEngine {
    idEngine
    name
    language
  }
  fkAccount
`;
exports.accountFragment = `fragment AccountFragment on Account {${accountFields}}`;
exports.repositoryFragment = `fragment RepositoryFragment on Repository {${repositoryFields}}`;
exports.grPlanFragment = `fragment GrPlanFragment on GrPlan {${grPlanFields}}`;
exports.reportFragment = `fragment ReportFragment on Report {${reportFields}}`;
exports.scanFragment = `fragment ScanFragment on Scan {${scanFields}}`;
exports.subscriptionChangelogFragment = `fragment SubscriptionChangelogFragment on SubscriptionChangelog {${subscriptionChangelogFields}}`;
exports.userFragment = `fragment UserFragment on User {${userFields}}`;
exports.findingFragment = `fragment FindingFragment on Finding {${findingFields}}`;
exports.samlProviderFragment = `fragment SamlProviderFragment on SamlProvider {${samlProviderFields}}`;
exports.samlUserFragment = `fragment SamlUserFragment on SamlUser {${samlUser}}`;
exports.actionFragment = `fragment ActionFragment on Action {${actionFields}}`;
exports.jiraIntegrationConfigFragment = `fragment JiraIntegrationConfigFragment on JiraIntegrationConfig {${jiraIntegrationConfigFields}}`;
exports.jiraRepositoryConfigFragment = `fragment JiraRepositoryConfigFragment on JiraRepositoryConfig {${jiraRepositoryConfigFields}}`;
exports.jiraIssueFragment = `fragment JiraIssueFragment on JiraIssue {${jiraIssueFields}}`;
exports.engineAccountConfigFragment = `fragment EngineAccountConfigFragment on EngineAccountConfig {${engineAccountConfigFields}}`;
//# sourceMappingURL=fragments.js.map