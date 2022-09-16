const { isStatusTransitionAllowed } = require('../../src/helpers/findings');

const FINDING_STATUS = {
  FIXED: 'FIXED',
  WONT_FIX: 'WONT_FIX',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  VULNERABILITY: 'VULNERABILITY',
  MARK_AS_FIXED: 'MARK_AS_FIXED',
  MARK_AS_VULNERABILITY: 'MARK_AS_VULNERABILITY'
};

const {
  WONT_FIX,
  FALSE_POSITIVE,
  MARK_AS_FIXED,
  MARK_AS_VULNERABILITY,
  VULNERABILITY
} = FINDING_STATUS;

describe('Findings helper', () => {
  // Status of null means that the finding is just a finding, i.e. it is
  // not a vulnerability (or won't fix, marked as fixed, marked as vulnerability etc).
  const FINDING_STATUS_NULL = null;

  // prettier-ignore
  // eslint-disable
  // Y-Axis is the current status.
  // X-Axis is the new status.
  // The boolean value in the table is if the transition from the current status -> new status should be valid or not.
  const transitionTable = [
    ['',                    FINDING_STATUS_NULL, WONT_FIX, FALSE_POSITIVE, MARK_AS_FIXED, MARK_AS_VULNERABILITY, VULNERABILITY],
    [FINDING_STATUS_NULL,   false,               false,    false,          false,         true,                  false         ],
    [WONT_FIX,              false,               false,    true,           true,          true,                  false         ],
    [FALSE_POSITIVE,        false,               true,     false,          true,          true,                  false         ],
    [MARK_AS_FIXED,         false,               true,     true,           false,         true,                  false         ],
    [MARK_AS_VULNERABILITY, false,               true,     true,           true,          false,                 false         ],
    [VULNERABILITY,         false,               true,     true,           true,          true,                  false         ],
  ];
  // eslint-enable

  // Go through the table above and see if the "isStatusTransitionAllowed" function is returning the correct value (true/false)
  // for each status transistion in the table.
  it('validate status transitions', () => {
    for (let y = 1; y < transitionTable.length; y++) {
      // The first column in the table is the current status.
      const currentStatus = transitionTable[y][0];

      for (let x = 1; x < transitionTable[y].length; x++) {
        // The first row in the table is the new status.
        const newStatus = transitionTable[0][x];

        const wasTransitionAllowed = isStatusTransitionAllowed(currentStatus, newStatus);
        const shouldTransitionBeAllowed = transitionTable[y][x];

        if (wasTransitionAllowed !== shouldTransitionBeAllowed) {
          throw new Error(
            `Finding status transition from ${currentStatus} -> ${newStatus} should ${
              shouldTransitionBeAllowed ? 'be allowed' : 'not be allowed'
            }`
          );
        }
      }
    }
  });

  it("should not be allowed to set new status to a status which doesn't exist", () => {
    const currentStatus = VULNERABILITY;
    const newStatus = "This isn't a valid status";

    const isAllowed = isStatusTransitionAllowed(currentStatus, newStatus);
    expect(isAllowed).toEqual(false);
  });
});
