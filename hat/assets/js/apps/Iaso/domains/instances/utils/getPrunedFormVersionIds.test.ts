import { getPrunedFormVersionIds } from './getPrunedFormVersionIds';

describe('getPrunedFormVersionIds', () => {
    const versionToFormMap = new Map<string, number>([
        ['10', 1],
        ['11', 1],
        ['20', 2],
        ['30', 3],
    ]);

    it('returns null if currentVersionIdsStr is null, undefined, or empty', () => {
        expect(
            getPrunedFormVersionIds(null, '1,2', versionToFormMap),
        ).toBeNull();
        expect(
            getPrunedFormVersionIds(undefined, '1,2', versionToFormMap),
        ).toBeNull();
        expect(getPrunedFormVersionIds('', '1,2', versionToFormMap)).toBeNull();
    });

    it('returns null if formIdsStr is null, undefined, or empty', () => {
        expect(
            getPrunedFormVersionIds('10,20', null, versionToFormMap),
        ).toBeNull();
        expect(
            getPrunedFormVersionIds('10,20', undefined, versionToFormMap),
        ).toBeNull();
        expect(
            getPrunedFormVersionIds('10,20', '', versionToFormMap),
        ).toBeNull();
    });

    it('returns original version IDs if versionToFormMap is empty', () => {
        const emptyMap = new Map<string, number>();
        expect(getPrunedFormVersionIds('10,20', '1,2', emptyMap)).toBe('10,20');
    });

    it('keeps versions whose parent forms are selected', () => {
        // Form 1 is selected -> keeps version 10 and 11
        expect(getPrunedFormVersionIds('10,11', '1', versionToFormMap)).toBe(
            '10,11',
        );

        // Form 1 and 2 selected -> keeps versions 10, 11, and 20
        expect(
            getPrunedFormVersionIds('10,11,20,30', '1,2', versionToFormMap),
        ).toBe('10,11,20');
    });

    it('removes versions whose parent forms are not selected', () => {
        // Form 2 is selected -> removes 10 and 11, keeps 20
        expect(getPrunedFormVersionIds('10,11,20', '2', versionToFormMap)).toBe(
            '20',
        );

        // Form 3 is selected -> removes 10, 11, 20, keeps 30
        expect(
            getPrunedFormVersionIds('10,11,20,30', '3', versionToFormMap),
        ).toBe('30');
    });

    it('returns null if all versions are pruned', () => {
        // Form 4 is selected but no versions belong to it -> returns null
        expect(
            getPrunedFormVersionIds('10,20', '4', versionToFormMap),
        ).toBeNull();
    });

    it('ignores unknown or missing versions in the map gracefully', () => {
        // '99' has no entry in map -> pruned
        expect(getPrunedFormVersionIds('10,99', '1', versionToFormMap)).toBe(
            '10',
        );
    });

    it('handles malformed form ID strings gracefully', () => {
        // 'abc' is ignored as NaN, but '1' is parsed -> keeps 10
        expect(
            getPrunedFormVersionIds('10,20', '1,abc', versionToFormMap),
        ).toBe('10');
    });
});
