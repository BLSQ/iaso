import isEqual from 'lodash/isEqual';
import { periodsReducer, periodsInitialState } from './reducer';
import { SET_PERIODS } from './actions';

describe('Periods reducer', () => {
    it('should return the initial state', () => {
        expect(periodsReducer(undefined)).to.equal(periodsInitialState);
    });

    it('should respond to SET_PERIODS', () => {
        const payload = [];
        const action = {
            type: SET_PERIODS,
            payload,
        };
        const expectedState = {
            list: payload,
        };
        expect(isEqual(periodsReducer({}, action), expectedState)).to.be.true;
    });
});
