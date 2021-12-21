import {
    SET_CURRENT_INSTANCE,
    SET_INSTANCES_FILTER_UDPATED,
    setInstancesFilterUpdated,
    setCurrentInstance,
    // fetchEditUrl,
    // fetchInstanceDetail,
    // softDeleteInstance,
    // reAssignInstance,
    // createInstance,
    // createExportRequest,
    // bulkDelete,
} from './actions';

// const Api = require('iaso/libs/Api');
// const snackBarsReducer = require('../../redux/snackBarsReducer');
// const snackBars = require('../../constants/snackBars');

// const formsActions = require('../../../redux/actions/formsActions');

// let actionStub;
describe('Instances actions', () => {
    it('should create an action to set instance filter update', () => {
        const payload = false;
        const expectedAction = {
            type: SET_INSTANCES_FILTER_UDPATED,
            payload,
        };
        const action = setInstancesFilterUpdated(payload);
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
