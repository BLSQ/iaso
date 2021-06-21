import {
    SET_INSTANCES,
    SET_INSTANCES_SMALL_DICT,
    SET_INSTANCES_FETCHING,
    SET_CURRENT_INSTANCE,
    SET_INSTANCES_FILTER_UDPATED,
    RESET_INSTANCES,
    setInstances,
    setInstancesSmallDict,
    setInstancesFilterUpdated,
    setInstancesFetching,
    setCurrentInstance,
    resetInstances,
    // fetchEditUrl,
    // fetchInstanceDetail,
    // softDeleteInstance,
    // reAssignInstance,
    // createInstance,
    // createExportRequest,
    // bulkDelete,
} from './actions';

// const Api = require('../../libs/Api');
// const snackBarsReducer = require('../../redux/snackBarsReducer');
// const snackBars = require('../../constants/snackBars');

// const formsActions = require('../../../redux/actions/formsActions');

// let actionStub;
describe('Instances actions', () => {
    it('should create an action to set instances list', () => {
        const list = ['HYRULE WARRIORS'];
        const payload = {
            list,
            count: 0,
            pages: 0,
            params: 'params',
            showPagination: true,
        };
        const expectedAction = {
            type: SET_INSTANCES,
            payload,
        };
        const action = setInstances(list, true, 'params', 0, 0);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set instance small dict', () => {
        const payload = ['HYRULE WARRIORS', 'GANON', 'URBOSA'];
        const expectedAction = {
            type: SET_INSTANCES_SMALL_DICT,
            payload,
        };
        const action = setInstancesSmallDict(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set instance filter update', () => {
        const payload = false;
        const expectedAction = {
            type: SET_INSTANCES_FILTER_UDPATED,
            payload,
        };
        const action = setInstancesFilterUpdated(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set is fetching', () => {
        const payload = false;
        const expectedAction = {
            type: SET_INSTANCES_FETCHING,
            payload,
        };
        const action = setInstancesFetching(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set current instance', () => {
        const payload = {
            id: 0,
            name: 'LINK',
        };
        const expectedAction = {
            type: SET_CURRENT_INSTANCE,
            payload,
        };
        const action = setCurrentInstance(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to reset instance reducer', () => {
        const expectedAction = {
            type: RESET_INSTANCES,
        };
        const action = resetInstances();
        expect(action).to.eql(expectedAction);
    });
    // it('should call getRequest on fetchEditUrl', () => {
    //     const resp = {
    //         edit_url: 'https://www.nintendo.be/',
    //     };
    //     actionStub = sinon
    //         .stub(Api, 'getRequest')
    //         .returns(new Promise(resolve => resolve(resp)));
    //     fetchEditUrl({
    //         uuid: 'KOKIRI',
    //     })(fn => fn);
    //     expect(actionStub.calledOnce).to.equal(true);
    // });
    afterEach(() => {
        sinon.restore();
    });
});
