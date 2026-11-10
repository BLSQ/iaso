import { describe, expect, it } from 'vitest';
import { DEFAULT_VISIBLE_COLUMNS, tableDefaults } from './useGetForms';

describe('forms table defaults', () => {
    it('orders by updated_at descending with a page size of 10', () => {
        expect(tableDefaults).toEqual({
            order: '-updated_at',
            limit: 10,
            page: 1,
        });
    });

    it('hides created_at and optional columns from the default visible set', () => {
        expect(DEFAULT_VISIBLE_COLUMNS).toEqual([
            'projects',
            'name',
            'updated_at',
            'org_unit_types',
        ]);
        expect(DEFAULT_VISIBLE_COLUMNS).not.toContain('created_at');
        expect(DEFAULT_VISIBLE_COLUMNS).not.toContain('period_type');
        expect(DEFAULT_VISIBLE_COLUMNS).not.toContain('single_per_period');
        expect(DEFAULT_VISIBLE_COLUMNS).not.toContain('instances_count');
    });
});
