import { SET_PERIODS, setPeriods } from './actions';

describe('Periods actions', () => {
    it('should create an action to set periods', () => {
        const payload = [];
        const expectedAction = {
            type: SET_PERIODS,
            payload,
        };
        const action = setPeriods(payload);
        expect(action).to.eql(expectedAction);
    });
});
