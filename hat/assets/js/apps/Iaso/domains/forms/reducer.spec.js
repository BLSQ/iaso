import isEqual from 'lodash/isEqual';
import { formsReducer, formsInitialState } from './reducer';
import { SET_FORMS } from './actions';

describe('Forms reducer', () => {
    it('should return the initial state', () => {
        expect(formsReducer(undefined)).to.equal(formsInitialState);
    });

    it('should respond to SET_FORMS', () => {
        const payload = {
            list: [],
            count: 0,
            pages: 1,
        };
        const action = {
            type: SET_FORMS,
            payload,
        };
        const expectedState = {
            formsPage: payload,
        };
        expect(isEqual(formsReducer({}, action), expectedState)).to.be.true;
    });
});
