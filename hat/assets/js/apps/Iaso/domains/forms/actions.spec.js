import {
    SET_FORMS,
    SET_CURRENT_FORM,
    SET_IS_LOADING_FORM,
    setForms,
    setCurrentForm,
    setIsLoadingForm,
    fetchFormDetail,
} from './actions';

const Api = require('../../libs/Api');

const formId = 'GANON';
let getRequest;

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

    describe('fetchFormDetail', () => {
        before(() => {
            getRequest = sinon.stub(Api, 'getRequest');
        });
        it(' should success on getRetquest', () => {
            const expectedRes = {
                name: 'ZELDA',
            };
            getRequest = getRequest.returns(
                new Promise(resolve => resolve(expectedRes)),
            );
            fetchFormDetail(formId)(fn => fn);
            expect(getRequest).to.have.been.called;
        });
        it(' should fail silently', () => {
            getRequest = getRequest.rejects(new Error());
            fetchFormDetail(formId)(fn => fn);
            expect(getRequest).to.have.been.called;
        });
        afterEach(() => {
            sinon.restore();
        });
    });
});
