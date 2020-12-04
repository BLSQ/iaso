import { projectsReducer, projectsInitialState } from './reducer';
import { SET_ALL_PROJECTS } from './actions';

describe('Projects reducer', () => {
    it('should return the initial state', () => {
        expect(projectsReducer(undefined)).to.equal(projectsInitialState);
    });

    it('should respond to SET_ALL_PROJECTS', () => {
        const payload = ['HYRULE WARRIORS'];
        const action = {
            type: SET_ALL_PROJECTS,
            payload,
        };
        const expectedState = {
            allProjects: payload,
        };
        expect(projectsReducer({}, action)).to.eql(expectedState);
    });
});
