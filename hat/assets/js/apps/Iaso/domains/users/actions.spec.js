import {
    SET_USERS_PROFILES,
    SET_CURRENT_USER,
    SET_IS_FETCHING_USERS,
    SET_PERMISSIONS,
    setUsersProfiles,
    setCurrentUser,
    setIsFetching,
    setPermissions,
} from './actions';

describe('Users actions', () => {
    it('should create an action to set users profiles', () => {
        const list = ['HYRULE WARRIORS'];
        const payload = {
            list,
            count: 0,
            pages: 0,
        };
        const expectedAction = {
            type: SET_USERS_PROFILES,
            payload,
        };
        const action = setUsersProfiles(list, payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set current user', () => {
        const payload = 'GANON';
        const expectedAction = {
            type: SET_CURRENT_USER,
            payload,
        };
        const action = setCurrentUser(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set is fetching', () => {
        const payload = 'URBOSA';
        const expectedAction = {
            type: SET_IS_FETCHING_USERS,
            payload,
        };
        const action = setIsFetching(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set permissions', () => {
        const payload = 'MIDONA';
        const expectedAction = {
            type: SET_PERMISSIONS,
            payload,
        };
        const action = setPermissions(payload);
        expect(action).to.eql(expectedAction);
    });
});
