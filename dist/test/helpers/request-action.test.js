"use strict";
const moxios = require('moxios');
const { createActionChangeLog } = require('../../src/helpers/core-api/actionChangeLogs');
const { createChangeStatusRequestAction, updatePendingActionAndFinding } = require('../../src/helpers/actions');
const { findSingleAction, createAction, updateAction, queryActionAndLatestChangeLog } = require('../../src/helpers/core-api/actions');
const { updateFinding, getFindingById } = require('../../src/helpers/core-api/findings');
const { ActionStatus } = require('../../src/interfaces');
jest.mock('../../src/helpers/core-api/actions');
jest.mock('../../src/helpers/core-api/actionChangeLogs');
jest.mock('../../src/helpers/core-api/findings');
jest.mock('../../sentry');
describe('Actions helper', () => {
    beforeEach(() => {
        moxios.install();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    afterEach(() => {
        moxios.uninstall();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    const validFinding = {
        idFinding: 7,
        repository: {
            idRepository: 1,
            fkAccount: 5
        },
        rule: {
            idRule: 2
        },
        metadata: {
            dependencyName: 'jquery',
            currentVersion: '1.8.1'
        },
        path: 'bower.json',
        lineNumber: 10,
        status: 'VULNERABILITY'
    };
    const validActionType = 'MARK_AS_VULNERABILITY';
    const validIdAccount = 5;
    const validActionId = 1;
    const validUser = {
        idUser: 'aaaaaaaa-d0f0-4f5c-9259-db624af0873f'
    };
    const validAction = {
        fromStatus: 'MARK_AS_VULNERABILITY',
        toStatus: 'MARK_AS_FIXED',
        findingId: 7,
        actionId: validActionId,
        fkRepository: 7
    };
    const requestNote = 'This is a request change note';
    describe('createChangeStatusRequestAction', () => {
        it('Should throw error if account id is not set', async () => {
            expect.assertions(1);
            try {
                await createChangeStatusRequestAction({ ...validFinding, repository: { ...validFinding.repository, fkAccount: null } }, validActionType, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('idAccount parameter was not set.');
            }
        });
        it('create action if no existing action is found and create a request type action change log', async () => {
            const newActionId = 'eaf5e13b-a1a6-4403-9412-6c6e7f6db3d8';
            createAction.mockReturnValueOnce({
                idAction: newActionId
            });
            findSingleAction.mockReturnValueOnce(undefined);
            await createChangeStatusRequestAction(validFinding, validActionType, validIdAccount, validUser, requestNote);
            expect(findSingleAction).toBeCalledWith(expect.objectContaining({
                fkAccount: { equalTo: 5 },
                fkRepository: { equalTo: 1 },
                fkRule: { equalTo: 2 },
                path: { equalTo: 'bower.json' },
                dependencyName: { equalTo: 'jquery' },
                dependencyVersion: { equalTo: '1.8.1' },
                transitiveDependency: { equalTo: false }
            }));
            expect(createAction).toBeCalledWith(expect.objectContaining({
                action: validActionType,
                fkAccount: validIdAccount,
                fkRepository: 1,
                fkRule: 2,
                path: 'bower.json',
                lineNumber: 10,
                dependencyName: validFinding.metadata.dependencyName,
                dependencyVersion: validFinding.metadata.currentVersion,
                transitiveDependency: false,
                fkFinding: validFinding.idFinding,
                status: 'PENDING'
            }));
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, newActionId, 'ACTION_REQUESTED', null, validActionType, requestNote);
            expect(updateAction).not.toHaveBeenCalled();
        });
        it('update action if an existing action is found and create a request type action change log with current finding status', async () => {
            const action = {
                idAction: 1,
                action: 'MARK_AS_FIXED'
            };
            updateAction.mockReturnValueOnce({ idAction: 1, action: validActionType });
            findSingleAction.mockReturnValueOnce(action);
            await createChangeStatusRequestAction(validFinding, validActionType, validIdAccount, validUser, requestNote);
            expect(updateAction).toBeCalledWith(action.idAction, validIdAccount, expect.objectContaining({
                action: validActionType,
                status: 'PENDING'
            }));
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, action.idAction, 'ACTION_REQUESTED', null, validActionType, requestNote);
            expect(createAction).not.toHaveBeenCalled();
        });
    });
    describe('updatePendingActionAndFinding', () => {
        it('should not update finding status when action is rejected', async () => {
            queryActionAndLatestChangeLog.mockReturnValueOnce(validAction);
            await updatePendingActionAndFinding(validIdAccount, validUser, {
                status: ActionStatus.REJECTED
            }, validAction);
            expect(updateAction).toBeCalledWith(validActionId, validIdAccount, {
                status: ActionStatus.REJECTED
            });
            expect(updateFinding).not.toHaveBeenCalled();
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, validActionId, 'ACTION_REJECTED', validAction.fromStatus, validAction.toStatus);
        });
        it('should update finding status when action is approved', async () => {
            queryActionAndLatestChangeLog.mockReturnValueOnce(validAction);
            getFindingById.mockReturnValueOnce(validFinding);
            await updatePendingActionAndFinding(validIdAccount, validUser, {
                status: ActionStatus.APPROVED
            }, validAction);
            expect(updateAction).toBeCalledWith(validActionId, validIdAccount, {
                status: ActionStatus.APPROVED
            });
            expect(updateFinding).toHaveBeenCalledTimes(1);
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, validActionId, 'ACTION_APPROVED', validAction.fromStatus, validAction.toStatus);
        });
    });
});
//# sourceMappingURL=request-action.test.js.map