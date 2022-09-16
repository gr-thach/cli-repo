"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRoleName = exports.ACLUserRole = exports.SystemUserRoleName = exports.UserRoleName = void 0;
var UserRoleName;
(function (UserRoleName) {
    UserRoleName["ADMIN"] = "admin";
    UserRoleName["DEVELOPER"] = "developer";
    UserRoleName["SECURITY_ENGINEER"] = "security_engineer";
    UserRoleName["MANAGER"] = "manager";
})(UserRoleName = exports.UserRoleName || (exports.UserRoleName = {}));
var SystemUserRoleName;
(function (SystemUserRoleName) {
    SystemUserRoleName["OWNER"] = "owner";
})(SystemUserRoleName = exports.SystemUserRoleName || (exports.SystemUserRoleName = {}));
var ACLUserRole;
(function (ACLUserRole) {
    ACLUserRole["READ"] = "acl_read";
    ACLUserRole["ADMIN"] = "acl_admin";
})(ACLUserRole = exports.ACLUserRole || (exports.ACLUserRole = {}));
var TeamRoleName;
(function (TeamRoleName) {
    TeamRoleName["DEVELOPER"] = "team_developer";
    TeamRoleName["SECURITY_ENGINEER"] = "team_security_engineer";
    TeamRoleName["TEAM_ADMIN"] = "team_admin";
})(TeamRoleName = exports.TeamRoleName || (exports.TeamRoleName = {}));
//# sourceMappingURL=roles.js.map