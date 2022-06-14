import { usersReducer, usersInitialState } from './reducer';
import {
    SET_USERS_PROFILES,
    SET_CURRENT_USER,
    SET_IS_FETCHING_USERS,
} from './actions';

describe('Users reducer', () => {
    it('should return the initial state', () => {
        expect(usersReducer(undefined)).to.equal(usersInitialState);
    });

    it('should respond to SET_USERS_PROFILES', () => {
        const payload = {
            list: ['HYRULE WARRIORS'],
            count: 0,
            pages: 0,
        };
        const action = {
            type: SET_USERS_PROFILES,
            payload,
        };
        const expectedState = {
            ...payload,
        };
        expect(usersReducer({}, action)).to.eql(expectedState);
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
    it('should respond to SET_IS_FETCHING_USERS', () => {
        const payload = 'LINK';
        const action = {
            type: SET_IS_FETCHING_USERS,
            payload,
        };
        const expectedState = {
            fetching: payload,
        };
        expect(usersReducer({}, action)).to.eql(expectedState);
    });
});
