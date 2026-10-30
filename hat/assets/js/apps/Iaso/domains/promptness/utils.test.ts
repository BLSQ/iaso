import { textPlaceholder } from 'bluesquare-components';
import { describe, expect, it } from 'vitest';
import { PROMPTNESS_STATUSES } from './constants';
import {
    formatPercent,
    getDefaultOrder,
    getNotApplicableTypeIds,
    getSelectedStatuses,
} from './utils';

describe('getSelectedStatuses', () => {
    it('returns all the statuses when there is no status filter', () => {
        expect(getSelectedStatuses()).toEqual(PROMPTNESS_STATUSES);
        expect(getSelectedStatuses('')).toEqual(PROMPTNESS_STATUSES);
    });

    it('returns the statuses of the filter', () => {
        expect(getSelectedStatuses('LATE')).toEqual(['LATE']);
        expect(getSelectedStatuses('ON_TIME,MISSING')).toEqual([
            'ON_TIME',
            'MISSING',
        ]);
    });
});

describe('getDefaultOrder', () => {
    it('orders by most missing when all the statuses are selected', () => {
        expect(getDefaultOrder()).toBe('-missing');
        expect(getDefaultOrder('ON_TIME,LATE,MISSING')).toBe('-missing');
    });

    it('orders by most missing when missing is selected', () => {
        expect(getDefaultOrder('ON_TIME,MISSING')).toBe('-missing');
        expect(getDefaultOrder('MISSING')).toBe('-missing');
    });

    it('orders by most late when missing is not selected', () => {
        expect(getDefaultOrder('ON_TIME,LATE')).toBe('-late');
        expect(getDefaultOrder('LATE')).toBe('-late');
    });

    it('orders by fewest on time when only on time is selected', () => {
        expect(getDefaultOrder('ON_TIME')).toBe('on_time');
    });

    it('does not depend on the order of the statuses in the filter', () => {
        expect(getDefaultOrder('LATE,ON_TIME')).toBe('-late');
        expect(getDefaultOrder('MISSING,ON_TIME')).toBe('-missing');
    });

    it('falls back to most missing for unknown statuses', () => {
        expect(getDefaultOrder('UNKNOWN')).toBe('-missing');
    });
});

describe('formatPercent', () => {
    it('returns the placeholder when there is no value', () => {
        expect(formatPercent()).toBe(textPlaceholder);
        expect(formatPercent(undefined)).toBe(textPlaceholder);
        expect(formatPercent(null)).toBe(textPlaceholder);
    });

    it('formats 0 as a percentage, not as a missing value', () => {
        expect(formatPercent(0)).toBe('0%');
    });

    it('rounds the percentage', () => {
        expect(formatPercent(42)).toBe('42%');
        expect(formatPercent(42.4)).toBe('42%');
        expect(formatPercent(42.5)).toBe('43%');
        expect(formatPercent(99.9)).toBe('100%');
        expect(formatPercent(100)).toBe('100%');
    });
});

describe('getNotApplicableTypeIds', () => {
    const orgUnitTypes = [
        { id: 1, depth: 0 },
        { id: 2, depth: 1 },
        { id: 3, depth: 2 },
        { id: 4, depth: 3 },
        { id: 5, depth: 4 },
    ];

    it('returns the types at or below the shallowest target type', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes, [4])).toEqual([5]);
        expect(getNotApplicableTypeIds(orgUnitTypes, [3])).toEqual([4, 5]);
    });

    it('never returns the target types', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes, [3, 5])).toEqual([4]);
    });

    it('uses the shallowest target type when there are several', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes, [5, 2])).toEqual([3, 4]);
    });

    it('returns nothing when the form has no target type', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes)).toEqual([]);
        expect(getNotApplicableTypeIds(orgUnitTypes, [])).toEqual([]);
    });

    it('returns nothing when the form targets org unit groups', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes, [3], [10])).toEqual([]);
    });

    it('returns nothing when the target types have no depth', () => {
        const typesWithoutDepth = [
            { id: 1, depth: null },
            { id: 2 },
            { id: 3, depth: 2 },
        ];
        expect(getNotApplicableTypeIds(typesWithoutDepth, [1, 2])).toEqual([]);
    });

    it('ignores the target types that are not in the list', () => {
        expect(getNotApplicableTypeIds(orgUnitTypes, [99])).toEqual([]);
        expect(getNotApplicableTypeIds(orgUnitTypes, [99, 4])).toEqual([5]);
    });

    it('never returns the types without depth', () => {
        const types = [...orgUnitTypes, { id: 6, depth: null }, { id: 7 }];
        expect(getNotApplicableTypeIds(types, [4])).toEqual([5]);
    });

    it('returns nothing when there are no org unit types', () => {
        expect(getNotApplicableTypeIds([], [4])).toEqual([]);
    });
});
