import moxios from 'moxios';
import { batchUpdateFindings } from '../../src/helpers/findings';
import {
  bulkUpdateActions,
  bulkCreateActions,
  queryActionsByFindings
} from '../../src/helpers/core-api/actions';

import * as findings from '../../src/helpers/core-api/findings';
import { ActionChangeLogType, ActionType } from '../../src/interfaces';
import { bulkCreateActionChangeLog } from '../../src/helpers/core-api/actionChangeLogs';

jest.mock('../../src/helpers/core-api/actions');
jest.mock('../../src/helpers/core-api/actionChangeLogs');
jest.mock('../../src/helpers/core-api/findings');

describe('Findings helper', () => {
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

  const accountId = 5;

  const params = {
    excludedIds: [],
    filters: { ruleIds: [7] },
    newStatus: ActionType.FALSE_POSITIVE,
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
      const response = await batchUpdateFindings(params);

      expect(response).toStrictEqual([{ updated: false, totalUpdatedFindings: 0 }]);

      expect(bulkUpdateActions).not.toBeCalled();
      expect(bulkCreateActions).not.toBeCalled();
      expect(bulkCreateActionChangeLog).not.toBeCalled();
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
        { ...validFinding, idFinding: idFinding2, status: ActionType.FALSE_POSITIVE },
        1
      ]);

      queryActionsByFindings.mockResolvedValue([{ idAction: null, idFinding: idFinding2 }]);

      bulkCreateActions.mockResolvedValueOnce([{ idAction: actionId }]);

      const response = await batchUpdateFindings({ ...params, excludedIds: [idFinding1] });

      expect(response).toStrictEqual([{ updated: true, totalUpdatedFindings: 1 }]);

      expect(findings.getFindingsByIds).toBeCalledWith(expect.objectContaining([idFinding2]));

      expect(bulkCreateActions).toBeCalledWith(
        expect.objectContaining([
          {
            action: ActionType.FALSE_POSITIVE,
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
        ])
      );

      expect(bulkCreateActionChangeLog).toBeCalledWith(
        expect.objectContaining([
          {
            userId: params.user.idUser,
            actionId,
            type: ActionChangeLogType.ACTION_CREATED,
            fromStatus: null,
            toStatus: ActionType.FALSE_POSITIVE
          }
        ])
      );

      expect(findings.bulkUpdateFindings).toBeCalledWith([idFinding2], {
        status: ActionType.FALSE_POSITIVE,
        fixedAt: null,
        fixedBy: null
      });
    });
  });
});
