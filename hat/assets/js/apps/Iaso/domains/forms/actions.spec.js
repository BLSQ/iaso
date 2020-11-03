import isEqual from 'lodash/isEqual';
import {
    SET_FORMS,
    SET_CURRENT_FORM,
    SET_IS_LOADING_FORM,
    setForms,
    setCurrentForm,
    setIsLoadingForm,
} from './actions';

describe('forms actions', () => {
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
        expect(
            isEqual(
                setForms(list, showPagination, params, count, pages),
                expectedAction,
            ),
        ).to.equal(true);
    });

    it('should create an action to set currentForm', () => {
        const expectedAction = {
            type: SET_CURRENT_FORM,
            payload: undefined,
        };

        expect(isEqual(setCurrentForm(), expectedAction)).to.equal(true);
    });

    it('should create an action to set loading', () => {
        const expectedAction = {
            type: SET_IS_LOADING_FORM,
            payload: undefined,
        };

        expect(isEqual(setIsLoadingForm(), expectedAction)).to.equal(true);
    });
});
