import { recursiveReducer } from './useObjectState.ts';

const state = {
    red: {
        name: 'Shiba',
        firstName: 'Takeru',
        powerSet: {
            vehicle: 'ShiShi origami',
            weapon: 'Rekka Daizanto',
        },
    },
    blue: {
        name: 'Ikenami',
        firstName: 'Ryuunosuke',
        powerSet: {
            vehicle: 'Ryuu origami',
            weapon: 'Water Arrow',
        },
    },
    pink: {
        name: 'Shiraishi',
        firstName: 'Mako',
        powerSet: {
            vehicle: 'Kame origami',
            weapon: 'Heaven Fan',
        },
    },
};

describe("useObjectState's recursiveReducer", () => {
    it('does not mutate original state', () => {
        const result = recursiveReducer(state, { ...state });
        expect(result).to.not.equal(state);
    });
    it('resets state when passed an empty object', () => {
        const result = recursiveReducer(state, {});
        expect(result).to.deep.equal({});
    });
    it('updates only keys passed in argument', () => {
        const result = recursiveReducer(state, {
            red: { firstName: 'Albert' },
        });
        expect(result.red.firstName).to.equal('Albert');
        expect(result.red.name).to.equal('Shiba');
        expect(result.red.powerSet.weapon).to.equal('Rekka Daizanto');
        expect(result.blue.firstName).to.equal('Ryuunosuke');
    });
    it("doesn't update if the type of the new value doesn't match the original", () => {
        const result = recursiveReducer(state, { red: { name: 1 } });
        expect(result.red.name).to.equal('Shiba');
    });
    it('accepts undefined as field value', () => {
        const result = recursiveReducer(state, { red: { name: undefined } });
        expect(result.red.name).to.equal(undefined);
    });
    it('adds the field if it does not exist', () => {
        const result = recursiveReducer(state, { green: { name: 'Tani' } });
        expect(result.green.name).to.equal('Tani');
    });
});
