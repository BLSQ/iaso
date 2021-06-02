import { reducer, orgUnitsTypesInitialState } from './reducer';

import {
    SET_ORG_UNIT_TYPES,
    SET_ALL_ORG_UNIT_TYPES,
    SET_IS_FETCHING_ORG_UNIT_TYPES,
} from './actions';

describe('Org unit type reducer', () => {
    it('should return the initial state', () => {
        expect(reducer(undefined)).to.equal(orgUnitsTypesInitialState);
    });

    it('should respond to SET_ORG_UNIT_TYPES with count an pages', () => {
        const payload = {
            list: [1, 2, 3],
            count: 38,
            pages: 10,
        };
        const action = {
            type: SET_ORG_UNIT_TYPES,
            payload,
        };
        expect(reducer({}, action)).to.deep.equal(payload);
    });

    it('should respond to SET_ORG_UNIT_TYPES', () => {
        const payload = {
            list: [1, 2, 3],
        };
        const action = {
            type: SET_ORG_UNIT_TYPES,
            payload,
        };
        const expectedState = {
            list: [1, 2, 3],
            count: 0,
            pages: 1,
        };
        expect(reducer({}, action)).to.deep.equal(expectedState);
    });

    it('should respond to SET_ALL_ORG_UNIT_TYPES', () => {
        const payload = [1, 2, 3];
        const action = {
            type: SET_ALL_ORG_UNIT_TYPES,
            payload,
        };
        const expectedState = {
            allTypes: payload,
        };
        expect(reducer({}, action)).to.deep.equal(expectedState);
    });

    it('should respond to SET_IS_FETCHING_ORG_UNIT_TYPES', () => {
        const action = {
            type: SET_IS_FETCHING_ORG_UNIT_TYPES,
            payload: true,
        };
        const expectedState = {
            fetching: true,
        };
        expect(reducer({}, action)).to.deep.equal(expectedState);
    });
});
