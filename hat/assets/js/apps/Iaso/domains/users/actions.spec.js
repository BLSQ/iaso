import { SET_CURRENT_USER, setCurrentUser } from './actions';

describe('Users actions', () => {
    it('should create an action to set current user', () => {
        const payload = 'GANON';
        const expectedAction = {
            type: SET_CURRENT_USER,
            payload,
        };
        const action = setCurrentUser(payload);
        expect(action).to.eql(expectedAction);
    });
});
