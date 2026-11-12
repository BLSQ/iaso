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

    it('defaults visible columns to projects, name, updated_at and org unit types', () => {
        expect(DEFAULT_VISIBLE_COLUMNS).toEqual([
            'projects',
            'name',
            'updated_at',
            'org_unit_types',
        ]);
    });
});
