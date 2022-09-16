"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionAction = exports.Resource = void 0;
var Resource;
(function (Resource) {
    // INSIGHTS = 'INSIGHTS',
    // CUSTOM_CONFIG = 'CUSTOM_CONFIG',
    // SSO = 'SSO',
    // CUSTOM_ENGINES = 'CUSTOM_ENGINES',
    // REPOSITORIES = 'REPOSITORIES',
    // VULNERABILITIES = 'VULNERABILITIES'
    Resource["API"] = "API";
    Resource["APPLICATIONS"] = "Applications";
    Resource["ACCOUNTS"] = "Accounts";
    Resource["ACTIONS"] = "Actions";
    Resource["CLI"] = "CLI";
    Resource["CUSTOM_ENGINES"] = "CustomEngines";
    Resource["ENGINES"] = "Engines";
    Resource["CUSTOM_CONFIG"] = "EnginesConfig";
    Resource["FINDINGS"] = "Findings";
    Resource["JIRA"] = "Jira";
    Resource["JIRA_CONFIG"] = "JiraConfig";
    Resource["PREHOOKS"] = "Prehooks";
    Resource["REPORTS"] = "Reports";
    Resource["REPOSITORIES"] = "Repositories";
    Resource["RULES"] = "Rules";
    Resource["SAML"] = "Saml";
    Resource["SCANS"] = "Scans";
    Resource["STATS"] = "Stats";
    Resource["SUBSCRIPTION"] = "Subscription";
    Resource["TEAMS"] = "Teams";
    Resource["USERS"] = "Users";
    Resource["USER_EVENTS"] = "UserEvents";
})(Resource = exports.Resource || (exports.Resource = {}));
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["READ"] = "read";
    PermissionAction["WRITE"] = "write";
})(PermissionAction = exports.PermissionAction || (exports.PermissionAction = {}));
//# sourceMappingURL=permissions.js.map