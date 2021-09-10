import { SET_FORMS, setForms } from './actions';

describe('Forms actions', () => {
    it('should create an action to set forms', () => {
        const payload = {
            list: [],
            count: 0,
            pages: 1,
        };
        const expectedAction = {
            type: SET_FORMS,
            payload,
        };
        const { list, count, pages } = payload;
        const action = setForms(list, count, pages);
        expect(action).to.eql(expectedAction);
    });
});
