"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moxios_1 = __importDefault(require("moxios"));
const findings_1 = require("../../src/helpers/findings");
const actions_1 = require("../../src/helpers/core-api/actions");
const findings = __importStar(require("../../src/helpers/core-api/findings"));
const interfaces_1 = require("../../src/interfaces");
const actionChangeLogs_1 = require("../../src/helpers/core-api/actionChangeLogs");
jest.mock('../../src/helpers/core-api/actions');
jest.mock('../../src/helpers/core-api/actionChangeLogs');
jest.mock('../../src/helpers/core-api/findings');
describe('Findings helper', () => {
    beforeEach(() => {
        moxios_1.default.install();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    afterEach(() => {
        moxios_1.default.uninstall();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    const accountId = 5;
    const params = {
        excludedIds: [],
        filters: { ruleIds: [7] },
        newStatus: interfaces_1.ActionType.FALSE_POSITIVE,
        idAccount: accountId,
        total: 2,
        user: {
            idUser: 'd6d98b88-c866-4496-9bd4-de7ba48d0f52',
            login: 'user'
        }
    };
    const idFinding1 = 'd6d98b88-c866-4496-9bd4-de7ba48d0f52';
    const idFinding2 = '29fa7bf9-0728-4272-a7bc-5b7c964f332d';
    const actionId = '29fa7bf9-0728-4272-a7bc-5b7c964f332d';
    const validFinding = {
        idFinding: idFinding1,
        fkRepository: 1,
        repository: {
            idRepository: 1,
            fkAccount: 5,
            name: 'repo1'
        },
        rule: {
            idRule: 2,
            name: '',
            title: '',
            docs: ''
        },
        metadata: {
            dependencyName: 'jquery',
            currentVersion: '1.8.1'
        },
        path: 'bower.json',
        lineNumber: 10,
        status: null,
        branch: 'master',
        fkEngineRule: null,
        fkCustomEngineRule: null,
        fkSeverity: null
    };
    describe('batchUpdateFindings', () => {
        it('Should not update any findings if there is no valid findings', async () => {
            findings.queryFindingIds.mockResolvedValueOnce([
                { idFinding: idFinding1 },
                { idFinding: idFinding2 }
            ]);
            findings.getFindingsByIds.mockResolvedValue([
                validFinding,
                { ...validFinding, idFinding: idFinding2 }
            ]);
            const response = await (0, findings_1.batchUpdateFindings)(params);
            expect(response).toStrictEqual([{ updated: false, totalUpdatedFindings: 0 }]);
            expect(actions_1.bulkUpdateActions).not.toBeCalled();
            expect(actions_1.bulkCreateActions).not.toBeCalled();
            expect(actionChangeLogs_1.bulkCreateActionChangeLog).not.toBeCalled();
            expect(findings.bulkUpdateFindings).not.toBeCalled();
        });
        it('Should update only findings that are not excluded', async () => {
            findings.queryFindingIds.mockResolvedValueOnce([
                { idFinding: idFinding1 },
                { idFinding: idFinding2 }
            ]);
            findings.getFindingsByIds.mockResolvedValue([
                { ...validFinding, idFinding: idFinding2, status: 'VULNERABILITY' }
            ]);
            findings.bulkUpdateFindings.mockResolvedValue([
                { ...validFinding, idFinding: idFinding2, status: interfaces_1.ActionType.FALSE_POSITIVE },
                1
            ]);
            actions_1.queryActionsByFindings.mockResolvedValue([{ idAction: null, idFinding: idFinding2 }]);
            actions_1.bulkCreateActions.mockResolvedValueOnce([{ idAction: actionId }]);
            const response = await (0, findings_1.batchUpdateFindings)({ ...params, excludedIds: [idFinding1] });
            expect(response).toStrictEqual([{ updated: true, totalUpdatedFindings: 1 }]);
            expect(findings.getFindingsByIds).toBeCalledWith(expect.objectContaining([idFinding2]));
            expect(actions_1.bulkCreateActions).toBeCalledWith(expect.objectContaining([
                {
                    action: interfaces_1.ActionType.FALSE_POSITIVE,
                    fkAccount: 5,
                    fkRepository: 1,
                    fkRule: 2,
                    path: 'bower.json',
                    lineNumber: 10,
                    dependencyName: validFinding.metadata.dependencyName,
                    dependencyVersion: validFinding.metadata.currentVersion,
                    transitiveDependency: false,
                    fkFinding: idFinding2
                }
            ]));
            expect(actionChangeLogs_1.bulkCreateActionChangeLog).toBeCalledWith(expect.objectContaining([
                {
                    userId: params.user.idUser,
                    actionId,
                    type: interfaces_1.ActionChangeLogType.ACTION_CREATED,
                    fromStatus: null,
                    toStatus: interfaces_1.ActionType.FALSE_POSITIVE
                }
            ]));
            expect(findings.bulkUpdateFindings).toBeCalledWith([idFinding2], {
                status: interfaces_1.ActionType.FALSE_POSITIVE,
                fixedAt: null,
                fixedBy: null
            });
        });
    });
});
//# sourceMappingURL=bulkFindings.test.js.map