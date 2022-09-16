"use strict";
const moment = require('moment');
describe('helpers/repository', () => {
    let formatRepositoriesStatsResponse;
    beforeAll(async () => {
        ({ formatRepositoriesStatsResponse } = require('../../src/helpers/repository')); // eslint-disable-line global-require
    });
    beforeEach(() => {
        jest.resetModules();
    });
    describe('formatRepositoriesStatsResponse', () => {
        it('should fill up empty days', () => {
            const fkRepository = 18712;
            const twentyDaysAgo = moment()
                .startOf('day')
                .subtract(20, 'days')
                .format('YYYY-MM-DD');
            const tenDaysAgo = moment()
                .startOf('day')
                .subtract(10, 'days')
                .format('YYYY-MM-DD');
            const sevenDaysAgo = moment()
                .startOf('day')
                .subtract(7, 'days')
                .format('YYYY-MM-DD');
            const today = moment().format('YYYY-MM-DD');
            const stats = [
                {
                    timegroup: `${sevenDaysAgo}T07:00:00.000Z`,
                    fkRepository: fkRepository,
                    totalVulnerabilities: 10
                },
                {
                    timegroup: `${twentyDaysAgo}T07:00:00.000Z`,
                    fkRepository: fkRepository,
                    totalVulnerabilities: 5
                },
                {
                    timegroup: `${tenDaysAgo}T07:00:00.000Z`,
                    fkRepository: fkRepository,
                    totalVulnerabilities: 0
                },
                {
                    timegroup: `${today}T07:00:00.000Z`,
                    fkRepository: fkRepository,
                    totalVulnerabilities: 20
                }
            ];
            expect(Object.values(formatRepositoriesStatsResponse(stats, 30)[fkRepository])).toEqual([
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                5,
                5,
                5,
                5,
                5,
                5,
                5,
                5,
                5,
                5,
                0,
                0,
                0,
                10,
                10,
                10,
                10,
                10,
                10,
                10,
                20
            ]);
            expect(formatRepositoriesStatsResponse(stats, 30)).toEqual({
                [fkRepository]: {
                    [moment()
                        .startOf('day')
                        .subtract(29, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(28, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(27, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(26, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(25, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(24, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(23, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(22, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(21, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(20, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(19, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(18, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(17, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(16, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(15, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(14, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(13, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(12, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(11, 'days')
                        .format('YYYY-MM-DD')]: 5,
                    [moment()
                        .startOf('day')
                        .subtract(10, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(9, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(8, 'days')
                        .format('YYYY-MM-DD')]: 0,
                    [moment()
                        .startOf('day')
                        .subtract(7, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(6, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(5, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(4, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(3, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(2, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment()
                        .startOf('day')
                        .subtract(1, 'days')
                        .format('YYYY-MM-DD')]: 10,
                    [moment().format('YYYY-MM-DD')]: 20
                }
            });
        });
    });
});
//# sourceMappingURL=repository.test.js.map