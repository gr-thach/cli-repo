"use strict";
jest.mock('../../../config', () => ({ env: { CORE_API_URI: 'http://core-api' } }));
const moxios = require('moxios');
const plansCore = require('../../../src/helpers/core-api/plans');
const { coreAxios } = require('../../../src/helpers/core-api/index');
describe('Plans core-api', () => {
    beforeEach(() => {
        moxios.install(coreAxios);
    });
    afterEach(() => {
        moxios.uninstall();
    });
    it('it should return plans', async () => {
        moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            request.respondWith({
                status: 200,
                response: {
                    data: {
                        grPlans: {
                            nodes: [{ idPlan: 1 }]
                        }
                    }
                }
            });
        });
        const plans = await plansCore.findAllPlans();
        expect(plans).toEqual([{ idPlan: 1, features: [] }]);
    });
});
//# sourceMappingURL=plans.test.js.map