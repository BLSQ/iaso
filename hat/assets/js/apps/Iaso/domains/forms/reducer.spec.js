import isEqual from 'lodash/isEqual';
import { formsReducer, formsInitialState } from './reducer';
import { SET_FORMS, SET_CURRENT_FORM, SET_IS_LOADING_FORM } from './actions';

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

    it('should respond to SET_CURRENT_FORM', () => {
        const payload = { id: 3 };
        const action = {
            type: SET_CURRENT_FORM,
            payload,
        };
        const expectedState = {
            current: payload,
        };
        expect(isEqual(formsReducer({}, action), expectedState)).to.be.true;
    });

    it('should respond to SET_IS_LOADING_FORM', () => {
        const action = {
            type: SET_IS_LOADING_FORM,
            payload: true,
        };
        const expectedState = {
            isLoading: true,
        };
        expect(isEqual(formsReducer({}, action), expectedState)).to.be.true;
    });
});
