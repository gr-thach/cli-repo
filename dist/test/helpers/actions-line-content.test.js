"use strict";
const moxios = require('moxios');
const { upsertActionByFinding } = require('../../src/helpers/actions');
const { findSingleAction, createAction, updateAction } = require('../../src/helpers/core-api/actions');
const { createActionChangeLog } = require('../../src/helpers/core-api/actionChangeLogs');
const reportError = require('../../sentry');
jest.mock('../../src/helpers/core-api/actions');
jest.mock('../../src/helpers/core-api/actionChangeLogs');
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
        path: 'src/main/java/com/gitlab/soshibby/vulnerableapp/controllers/UnsafeRegexController.java',
        lineNumber: 10,
        lineContent: '  boolean isValidMailAddress = Pattern.compile(pattern)  '
    };
    const validAction = 'MARK_AS_VULNERABILITY';
    const validIdAccount = 5;
    const validUser = {
        idUser: 'aaaaaaaa-d0f0-4f5c-9259-db624af0873f'
    };
    const copy = obj => {
        return JSON.parse(JSON.stringify(obj));
    };
    describe('upsertActionByFinding (line content)', () => {
        it('Should throw error if account id is not set', async () => {
            expect.assertions(1);
            try {
                await upsertActionByFinding({ ...validFinding, repository: { ...validFinding.repository, fkAccount: null } }, validAction, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('idAccount parameter was not set.');
            }
        });
        it('Should throw error if repository id is not set on line content finding', async () => {
            expect.assertions(1);
            const finding = copy(validFinding);
            delete finding.repository.idRepository;
            try {
                await upsertActionByFinding(finding, validAction, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('Failed to map finding properties to action properties, some properties (fkRepository) are undefined');
            }
        });
        it('Should throw error if rule id is not set on line content finding', async () => {
            expect.assertions(1);
            const finding = copy(validFinding);
            delete finding.rule.idRule;
            try {
                await upsertActionByFinding(finding, validAction, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('Failed to map finding properties to action properties, some properties (fkRule) are undefined');
            }
        });
        it('Should throw error if path is not set on line content finding', async () => {
            expect.assertions(1);
            const finding = copy(validFinding);
            delete finding.path;
            try {
                await upsertActionByFinding(finding, validAction, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('Failed to map finding properties to action properties, some properties (path) are undefined');
            }
        });
        it("Should not create line content action if line content (and dependency name) doesn't exist on finding", async () => {
            const finding = copy(validFinding);
            delete finding.lineContent;
            await upsertActionByFinding(finding, validAction, validIdAccount, validUser);
            expect(updateAction).not.toHaveBeenCalled();
            expect(createAction).not.toHaveBeenCalled();
            expect(createActionChangeLog).not.toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
        });
        // Here is an example where this can happen: https://github.com/guardrailsio/engine-ruby-brakeman/blob/develop/engine-ruby-brakeman.js#L39
        it('Should not create action if line content contains [GR-Error]', async () => {
            const finding = copy(validFinding);
            finding.lineContent = '[GR-Error] Error occurred in parsing line content.';
            await upsertActionByFinding(finding, validAction, validIdAccount, validUser);
            expect(updateAction).not.toHaveBeenCalled();
            expect(createAction).not.toHaveBeenCalled();
            expect(createActionChangeLog).not.toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
        });
        it('create line content action if no existing action is found', async () => {
            const newActionId = 'eaf5e13b-a1a6-4403-9412-6c6e7f6db3d8';
            createAction.mockReturnValueOnce({
                idAction: newActionId
            });
            findSingleAction.mockReturnValueOnce(undefined);
            await upsertActionByFinding(validFinding, validAction, validIdAccount, validUser);
            expect(findSingleAction).toBeCalledWith(expect.objectContaining({
                fkAccount: { equalTo: 5 },
                fkRepository: { equalTo: 1 },
                fkRule: { equalTo: 2 },
                path: { equalTo: validFinding.path },
                lineContent: { equalTo: 'boolean isValidMailAddress = Pattern.compile(pattern)' }
            }));
            expect(createAction).toBeCalledWith(expect.objectContaining({
                action: validAction,
                fkAccount: validIdAccount,
                fkRepository: 1,
                fkRule: 2,
                path: 'src/main/java/com/gitlab/soshibby/vulnerableapp/controllers/UnsafeRegexController.java',
                lineNumber: 10,
                lineContent: 'boolean isValidMailAddress = Pattern.compile(pattern)',
                fkFinding: validFinding.idFinding
            }));
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, newActionId, 'ACTION_CREATED', null, validAction);
            expect(updateAction).not.toHaveBeenCalled();
        });
        it('update line content action if an existing action is found', async () => {
            const action = {
                idAction: 1,
                action: 'MARK_AS_FIXED'
            };
            updateAction.mockReturnValueOnce({ idAction: 1, action: validAction });
            findSingleAction.mockReturnValueOnce(action);
            await upsertActionByFinding(validFinding, validAction, validIdAccount, validUser);
            expect(updateAction).toBeCalledWith(action.idAction, validIdAccount, expect.objectContaining({
                action: validAction
            }));
            expect(createActionChangeLog).toBeCalledWith(validUser.idUser, action.idAction, 'ACTION_UPDATED', action.action, validAction);
            expect(createAction).not.toHaveBeenCalled();
        });
        it('throw error if multiple line content actions matches', async () => {
            expect.assertions(4);
            findSingleAction.mockImplementation(() => {
                throw new Error('Found more than one action with id 7');
            });
            try {
                await upsertActionByFinding(validFinding, validAction, validIdAccount, validUser);
            }
            catch (e) {
                expect(e.message).toContain('Found more than one action with id 7');
            }
            expect(createAction).not.toHaveBeenCalled();
            expect(createActionChangeLog).not.toHaveBeenCalled();
            expect(updateAction).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=actions-line-content.test.js.map