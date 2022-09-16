import { Router } from 'express';
import jwtMiddlewareCookie from '../../middlewares/jwtMiddlewareCookie';
import accountMiddleware from '../../middlewares/accountMiddleware';
import user from './user';
import preHook from './preHook';
import stripe from './stripe';
import plans from './plans';
import repositories from './repositories';
import accounts from './accounts';
import subscription from './subscription';
import billing from './billing';
import engineConfigs from './engineConfigs';
import engines from './engines';
import userEvents from './userEvents';
import branches from './branches';
import auth from './auth';
import findings from './findings';
import scans from './scans';
import actions from './actions';
import badges from './badges';
import cli from './cli';
import reports from './reports';
import rules from './rules';
import stats from './stats';
import actionChangeLogs from './actionChangeLogs';
import teams from './teams';
import applications from './applications';
import roles from './roles';
import departments from './departments';
import dependencies from './dependencies';

const samlJwtMiddlewareCookie = require('../../middlewares/samlJwtMiddlewareCookie');
const samlUser = require('./samlUser');
const samlProvider = require('./samlProvider');
const jira = require('./jira');

const router = Router();

// No middleware rotues
router.use('/auth', auth);
router.use('/badges', badges);
router.use('/cli', cli);
router.use('/pre-hook', preHook);
router.use('/stripe', stripe);

// No account middleware needed
router.use('/roles', jwtMiddlewareCookie, roles);

// Common use: jwtMiddlewareCookie + accountMiddleware
router.use('/accounts', jwtMiddlewareCookie, accountMiddleware, accounts);
router.use('/action-changelogs', jwtMiddlewareCookie, accountMiddleware, actionChangeLogs);
router.use('/actions', jwtMiddlewareCookie, accountMiddleware, actions);
router.use('/applications', jwtMiddlewareCookie, accountMiddleware, applications);
router.use('/billing', jwtMiddlewareCookie, accountMiddleware, billing);
router.use('/branches', jwtMiddlewareCookie, accountMiddleware, branches);
router.use('/departments', jwtMiddlewareCookie, accountMiddleware, departments);
router.use('/dependencies', jwtMiddlewareCookie, accountMiddleware, dependencies);
router.use('/engine-configs', jwtMiddlewareCookie, accountMiddleware, engineConfigs);
router.use('/engines', jwtMiddlewareCookie, accountMiddleware, engines);
router.use('/findings', jwtMiddlewareCookie, accountMiddleware, findings);
router.use('/integrations/jira', jwtMiddlewareCookie, accountMiddleware, jira);
router.use('/plans', jwtMiddlewareCookie, accountMiddleware, plans);
router.use('/reports', jwtMiddlewareCookie, accountMiddleware, reports);
router.use('/repositories', jwtMiddlewareCookie, accountMiddleware, repositories);
router.use('/rules', jwtMiddlewareCookie, accountMiddleware, rules);
router.use('/saml/providers', jwtMiddlewareCookie, accountMiddleware, samlProvider);
router.use('/saml/user', samlJwtMiddlewareCookie, jwtMiddlewareCookie, accountMiddleware, samlUser);
router.use('/scans', jwtMiddlewareCookie, accountMiddleware, scans);
router.use('/stats', jwtMiddlewareCookie, accountMiddleware, stats);
router.use('/subscription', jwtMiddlewareCookie, accountMiddleware, subscription);
router.use('/teams', jwtMiddlewareCookie, accountMiddleware, teams);
router.use('/user', jwtMiddlewareCookie, accountMiddleware, user);
router.use('/userEvents', jwtMiddlewareCookie, accountMiddleware, userEvents);

module.exports = router;
