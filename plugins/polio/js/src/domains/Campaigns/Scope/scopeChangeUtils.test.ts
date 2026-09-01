import { Scope } from '../../../constants/types';
import {
    applyScopeChange,
    countDistricts,
    countMergedDistricts,
    mergeScopes,
} from './scopeChangeUtils';

const scope = (vaccine: string | undefined, orgUnits: number[]): Scope => ({
    vaccine: vaccine as Scope['vaccine'],
    group: { org_units: orgUnits },
});

describe('scopeChangeUtils', () => {
    it('counts unique districts in a scope list', () => {
        expect(
            countDistricts([scope('nOPV2', [1, 2]), scope('bOPV', [2, 3])]),
        ).toBe(3);
    });

    it('merges round scopes, dropping duplicate districts', () => {
        const merged = mergeScopes([
            [scope('nOPV2', [1, 2])],
            [scope('nOPV2', [2, 3])],
        ]);
        expect(countDistricts(merged)).toBe(3);
        expect(merged).toEqual([scope('nOPV2', [1, 2, 3])]);
    });

    it('lets a later round win when the same district has two vaccines', () => {
        const merged = mergeScopes([
            [scope('nOPV2', [1, 2])],
            [scope('bOPV', [2])],
        ]);
        expect(merged).toEqual([scope('nOPV2', [1]), scope('bOPV', [2])]);
    });

    it('counts the union across several round scopes', () => {
        expect(
            countMergedDistricts([
                [scope('nOPV2', [1, 2])],
                [scope('nOPV2', [2, 3, 4])],
            ]),
        ).toBe(4);
    });

    it('copies campaign scopes onto selected rounds only', () => {
        const campaignScopes = [scope('nOPV2', [1])];
        const result = applyScopeChange({
            toRounds: true,
            campaignScopes,
            selectedRoundNumbers: [2],
            rounds: [
                { number: 1, scopes: [scope('bOPV', [9])] },
                { number: 2, scopes: [] },
            ],
        });
        expect(result.rounds.map(round => round.number)).toEqual([1, 2]);
        expect(result.rounds[0].scopes).toEqual([]);
        expect(result.rounds[1].scopes).toEqual(campaignScopes);
        expect(result.rounds[1].scopes).not.toBe(campaignScopes);
    });

    it('merges selected round scopes into the campaign', () => {
        const result = applyScopeChange({
            toRounds: false,
            campaignScopes: [],
            selectedRoundNumbers: [1, 2],
            rounds: [
                { number: 2, scopes: [scope('nOPV2', [2, 3])] },
                { number: 1, scopes: [scope('nOPV2', [1])] },
                { number: 3, scopes: [scope('bOPV', [9])] },
            ],
        });
        expect(result.scopes).toEqual([scope('nOPV2', [1, 2, 3])]);
    });
});
