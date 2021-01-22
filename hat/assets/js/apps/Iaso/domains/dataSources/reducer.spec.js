import { dataSourcesReducer, dataSourcesInitialState } from './reducer';
import { SET_ALL_SOURCES } from './actions';

describe('DataSource reducer', () => {
    it('should return the initial state', () => {
        expect(dataSourcesReducer(undefined)).to.equal(dataSourcesInitialState);
    });

    it('should respond to SET_ALL_SOURCES', () => {
        const payload = {
            list: [
                {
                    name: 'reference_play_test2.32.6',
                    description: 'reference_play_test2.32.6',
                    read_only: false,
                },
            ],
            count: 1,
            pages: 1,
        };

        const action = {
            type: SET_ALL_SOURCES,
            payload,
        };

        const expectedState = {
            ...payload,
        };
        expect(dataSourcesReducer({}, action)).to.eql(expectedState);
    });
});
