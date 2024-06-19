import { SET_CURRENT_USER } from './actions';
import { usersInitialState, usersReducer } from './reducer';

describe('Users reducer', () => {
    it('should return the initial state', () => {
        expect(usersReducer(undefined)).to.equal(usersInitialState);
    });
    it('should respond to SET_CURRENT_USER', () => {
        const payload = 'IMPA';
        const action = {
            type: SET_CURRENT_USER,
            payload,
        };
        const expectedState = {
            current: payload,
        };
        expect(usersReducer({}, action)).to.eql(expectedState);
    });
});
