import { dataSourcesReducer, dataSourcesInitialState } from './reducer';
import { SET_ALL_SOURCES } from './actions';

describe('DataSource reducer', () => {
    it('should return the initial state', () => {
        expect(dataSourcesReducer(undefined)).to.equal(dataSourcesInitialState);
    });

    it('should respond to SET_ALL_SOURCES', () => {
        const payload = ['HYRULE WARRIORS'];
        const action = {
            type: SET_ALL_SOURCES,
            payload,
        };
        const expectedState = {
            allProjects: payload,
        };
        expect(dataSourcesReducer({}, action)).to.eql(expectedState);
    });
});
