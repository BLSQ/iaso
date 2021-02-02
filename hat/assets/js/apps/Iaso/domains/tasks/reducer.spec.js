import { tasksReducer, tasksInitialState } from './reducer';
import { SET_ALL_TASKS } from './actions';

describe('Tasks reducer', () => {
    it('should return the initial state', () => {
        expect(tasksReducer(undefined)).to.equal(tasksInitialState);
    });

    it('should respond to SET_ALL_SOURCES', () => {
        const payload = {
            list: ['LIST OF TASKS'],
            count: 1,
            pages: 1,
        };

        const action = {
            type: SET_ALL_TASKS,
            payload,
        };

        const expectedState = {
            ...payload,
        };
        expect(tasksReducer({}, action)).to.eql(expectedState);
    });
});
