import {
    SET_ORG_UNIT_TYPES,
    SET_ALL_ORG_UNIT_TYPES,
    SET_IS_FETCHING_ORG_UNIT_TYPES,
    setAllOrgUnitTypes,
    setIsFetching,
    fetchOrgUnitTypes,
    fetchAllOrgUnitTypes,
    saveOrgUnitType,
    createOrgUnitType,
    deleteOrgUnitType,
    setOrgUnitTypes,
} from './actions';

const formsActions = require('../../../redux/actions/formsActions');

let actionStub;
describe('Org unit types actions', () => {
    it('should create an action to set org unit types list', () => {
        const list = ['HYRULE WARRIORS'];
        const payload = {
            list,
            count: 0,
            pages: 0,
        };
        const expectedAction = {
            type: SET_ORG_UNIT_TYPES,
            payload,
        };
        const action = setOrgUnitTypes(list, payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set all org unit types', () => {
        const payload = ['HYRULE WARRIORS', 'GANON', 'URBOSA'];
        const expectedAction = {
            type: SET_ALL_ORG_UNIT_TYPES,
            payload,
        };
        const action = setAllOrgUnitTypes(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should create an action to set is fetching', () => {
        const payload = 'URBOSA';
        const expectedAction = {
            type: SET_IS_FETCHING_ORG_UNIT_TYPES,
            payload,
        };
        const action = setIsFetching(payload);
        expect(action).to.eql(expectedAction);
    });
    it('should call fetchAction on fetchOrgUnitTypes', () => {
        actionStub = sinon.stub(formsActions, 'fetchAction');
        fetchOrgUnitTypes()(fn => fn);
        expect(actionStub.calledOnce).to.equal(true);
    });
    it('should call fetchAction on fetchAllOrgUnitTypes', () => {
        actionStub = sinon.stub(formsActions, 'fetchAction');
        fetchAllOrgUnitTypes()(fn => fn);
        expect(actionStub.calledOnce).to.equal(true);
    });
    it('should call saveAction on saveOrgUnitType', () => {
        actionStub = sinon.stub(formsActions, 'saveAction');
        saveOrgUnitType([{ value: 'TAMERENSHORT' }])(fn => fn);
        expect(actionStub.calledOnce).to.equal(true);
    });
    it('should call createAction on createOrgUnitType', () => {
        actionStub = sinon.stub(formsActions, 'createAction');
        createOrgUnitType([{ value: 'TAMERENSHORT' }])(fn => fn);
        expect(actionStub.calledOnce).to.equal(true);
    });
    it('should call deleteAction on deleteOrgUnitType', () => {
        actionStub = sinon.stub(formsActions, 'deleteAction');
        deleteOrgUnitType()(fn => fn);
        expect(actionStub.calledOnce).to.equal(true);
    });
    afterEach(() => {
        sinon.restore();
    });
});
