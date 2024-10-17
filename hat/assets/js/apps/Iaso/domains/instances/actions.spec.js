import {
    SET_INSTANCES_FILTER_UDPATED,
    setInstancesFilterUpdated,
} from './actions';

// const Api = require('iaso/libs/Api');
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
