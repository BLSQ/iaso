import isEqual from 'lodash/isEqual';
import {
    SET_FORMS,
    SET_CURRENT_FORM,
    SET_IS_LOADING_FORM,
    setForms,
    setCurrentForm,
    setIsLoadingForm,
} from './actions';

describe('Forms actions', () => {
    it('should create an action to set forms', () => {
        const payload = {
            list: [],
            showPagination: true,
            params: {},
            count: 0,
            pages: 1,
        };
        const expectedAction = {
            type: SET_FORMS,
            payload,
        };
        const { list, showPagination, params, count, pages } = payload;
        const action = setForms(list, showPagination, params, count, pages);
        expect(action).to.eql(expectedAction);
    });

    it('should create an action to set currentForm', () => {
        const expectedAction = {
            type: SET_CURRENT_FORM,
            payload: undefined,
        };

        const action = setCurrentForm();
        expect(action).to.eql(expectedAction);
    });

    it('should create an action to set loading', () => {
        const expectedAction = {
            type: SET_IS_LOADING_FORM,
            payload: undefined,
        };

        const action = setIsLoadingForm();
        expect(action).to.eql(expectedAction);
    });
});
