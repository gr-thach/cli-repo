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

export const accountFragment = `fragment AccountFragment on Account {${accountFields}}`;

export const repositoryFragment = `fragment RepositoryFragment on Repository {${repositoryFields}}`;

export const grPlanFragment = `fragment GrPlanFragment on GrPlan {${grPlanFields}}`;

export const reportFragment = `fragment ReportFragment on Report {${reportFields}}`;

export const scanFragment = `fragment ScanFragment on Scan {${scanFields}}`;

export const subscriptionChangelogFragment = `fragment SubscriptionChangelogFragment on SubscriptionChangelog {${subscriptionChangelogFields}}`;

export const userFragment = `fragment UserFragment on User {${userFields}}`;

export const findingFragment = `fragment FindingFragment on Finding {${findingFields}}`;

export const samlProviderFragment = `fragment SamlProviderFragment on SamlProvider {${samlProviderFields}}`;

export const samlUserFragment = `fragment SamlUserFragment on SamlUser {${samlUser}}`;

export const actionFragment = `fragment ActionFragment on Action {${actionFields}}`;

export const jiraIntegrationConfigFragment = `fragment JiraIntegrationConfigFragment on JiraIntegrationConfig {${jiraIntegrationConfigFields}}`;

export const jiraRepositoryConfigFragment = `fragment JiraRepositoryConfigFragment on JiraRepositoryConfig {${jiraRepositoryConfigFields}}`;

export const jiraIssueFragment = `fragment JiraIssueFragment on JiraIssue {${jiraIssueFields}}`;

export const engineAccountConfigFragment = `fragment EngineAccountConfigFragment on EngineAccountConfig {${engineAccountConfigFields}}`;
