"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwtMiddlewareCookie_1 = __importDefault(require("../../middlewares/jwtMiddlewareCookie"));
const accountMiddleware_1 = __importDefault(require("../../middlewares/accountMiddleware"));
const user_1 = __importDefault(require("./user"));
const preHook_1 = __importDefault(require("./preHook"));
const stripe_1 = __importDefault(require("./stripe"));
const plans_1 = __importDefault(require("./plans"));
const repositories_1 = __importDefault(require("./repositories"));
const accounts_1 = __importDefault(require("./accounts"));
const subscription_1 = __importDefault(require("./subscription"));
const billing_1 = __importDefault(require("./billing"));
const engineConfigs_1 = __importDefault(require("./engineConfigs"));
const engines_1 = __importDefault(require("./engines"));
const userEvents_1 = __importDefault(require("./userEvents"));
const branches_1 = __importDefault(require("./branches"));
const auth_1 = __importDefault(require("./auth"));
const findings_1 = __importDefault(require("./findings"));
const scans_1 = __importDefault(require("./scans"));
const actions_1 = __importDefault(require("./actions"));
const badges_1 = __importDefault(require("./badges"));
const cli_1 = __importDefault(require("./cli"));
const reports_1 = __importDefault(require("./reports"));
const rules_1 = __importDefault(require("./rules"));
const stats_1 = __importDefault(require("./stats"));
const actionChangeLogs_1 = __importDefault(require("./actionChangeLogs"));
const teams_1 = __importDefault(require("./teams"));
const applications_1 = __importDefault(require("./applications"));
const roles_1 = __importDefault(require("./roles"));
const departments_1 = __importDefault(require("./departments"));
const dependencies_1 = __importDefault(require("./dependencies"));
const samlJwtMiddlewareCookie = require('../../middlewares/samlJwtMiddlewareCookie');
const samlUser = require('./samlUser');
const samlProvider = require('./samlProvider');
const jira = require('./jira');
const router = (0, express_1.Router)();
// No middleware rotues
router.use('/auth', auth_1.default);
router.use('/badges', badges_1.default);
router.use('/cli', cli_1.default);
router.use('/pre-hook', preHook_1.default);
router.use('/stripe', stripe_1.default);
// No account middleware needed
router.use('/roles', jwtMiddlewareCookie_1.default, roles_1.default);
// Common use: jwtMiddlewareCookie + accountMiddleware
router.use('/accounts', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, accounts_1.default);
router.use('/action-changelogs', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, actionChangeLogs_1.default);
router.use('/actions', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, actions_1.default);
router.use('/applications', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, applications_1.default);
router.use('/billing', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, billing_1.default);
router.use('/branches', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, branches_1.default);
router.use('/departments', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, departments_1.default);
router.use('/dependencies', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, dependencies_1.default);
router.use('/engine-configs', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, engineConfigs_1.default);
router.use('/engines', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, engines_1.default);
router.use('/findings', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, findings_1.default);
router.use('/integrations/jira', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, jira);
router.use('/plans', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, plans_1.default);
router.use('/reports', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, reports_1.default);
router.use('/repositories', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, repositories_1.default);
router.use('/rules', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, rules_1.default);
router.use('/saml/providers', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, samlProvider);
router.use('/saml/user', samlJwtMiddlewareCookie, jwtMiddlewareCookie_1.default, accountMiddleware_1.default, samlUser);
router.use('/scans', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, scans_1.default);
router.use('/stats', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, stats_1.default);
router.use('/subscription', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, subscription_1.default);
router.use('/teams', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, teams_1.default);
router.use('/user', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, user_1.default);
router.use('/userEvents', jwtMiddlewareCookie_1.default, accountMiddleware_1.default, userEvents_1.default);
module.exports = router;
//# sourceMappingURL=index.js.map