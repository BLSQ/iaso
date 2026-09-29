import { describe, expect, it } from 'vitest';
import {
    getPrunedFormVersionIds,
    PrunableFormVersion,
} from './getPrunedFormVersionIds';

describe('getPrunedFormVersionIds', () => {
    const formVersions: PrunableFormVersion[] = [
        { value: '10', formId: 1 },
        { value: '11', formId: 1 },
        { value: '20', formId: 2 },
        { value: '30', formId: 3 },
    ];

    it('returns null if currentVersionIdsStr is null, undefined, or empty', () => {
        expect(getPrunedFormVersionIds(null, '1,2', formVersions)).toBeNull();
        expect(
            getPrunedFormVersionIds(undefined, '1,2', formVersions),
        ).toBeNull();
        expect(getPrunedFormVersionIds('', '1,2', formVersions)).toBeNull();
    });

    it('returns null if formIdsStr is null, undefined, or empty', () => {
        expect(getPrunedFormVersionIds('10,20', null, formVersions)).toBeNull();
        expect(
            getPrunedFormVersionIds('10,20', undefined, formVersions),
        ).toBeNull();
        expect(getPrunedFormVersionIds('10,20', '', formVersions)).toBeNull();
    });

    it('returns currentVersionIdsStr unchanged if formVersions is empty', () => {
        expect(getPrunedFormVersionIds('10,20', '1,2', [])).toBe('10,20');
    });

    it('retains version ids whose parent form is still selected', () => {
        expect(getPrunedFormVersionIds('10,11', '1', formVersions)).toBe(
            '10,11',
        );
    });

    it('prunes version ids whose parent form is no longer selected', () => {
        expect(
            getPrunedFormVersionIds('10,11,20,30', '1,2', formVersions),
        ).toBe('10,11,20');
        expect(getPrunedFormVersionIds('10,11,20', '2', formVersions)).toBe(
            '20',
        );
        expect(getPrunedFormVersionIds('10,11,20,30', '3', formVersions)).toBe(
            '30',
        );
    });

    it('returns null when all version ids belong to unselected forms', () => {
        expect(getPrunedFormVersionIds('10,20', '4', formVersions)).toBeNull();
    });

    it('prunes version ids that are not present in formVersions', () => {
        expect(getPrunedFormVersionIds('10,99', '1', formVersions)).toBe('10');
    });

    it('ignores non-numeric form ids gracefully', () => {
        expect(getPrunedFormVersionIds('10,20', '1,abc', formVersions)).toBe(
            '10',
        );
    });
});
