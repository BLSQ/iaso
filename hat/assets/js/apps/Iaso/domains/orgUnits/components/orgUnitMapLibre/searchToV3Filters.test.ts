import { describe, expect, it } from 'vitest';
import { searchToV3Filters } from './searchToV3Filters';

describe('searchToV3Filters', () => {
    it('defaults to valid org units, like the search', () => {
        expect(searchToV3Filters({})).toEqual({
            filters: { validation_status__in: 'VALID' },
            unsupported: [],
        });
        expect(searchToV3Filters({ validation_status: 'all' }).filters).toEqual(
            {},
        );
    });

    it('maps the search filters onto v3 filters', () => {
        expect(
            searchToV3Filters({
                search: 'ids:1,2',
                version: '20',
                project: 3,
                orgUnitTypeId: '41,42',
                groups: undefined,
                validation_status: 'VALID,NEW',
                levels: '346368',
                geography: 'location',
                hasInstances: 'true',
                color: 'ff0000',
                isAdded: false,
            }),
        ).toEqual({
            filters: {
                search: 'ids:1,2',
                version_id: '20',
                project_id: '3',
                org_unit_type_id__in: '41,42',
                validation_status__in: 'VALID,NEW',
                ancestor_id__or_self: '346368',
                has_location: true,
                has_instances: true,
            },
            unsupported: [],
        });
    });

    it('takes the parent copied by useGetApiParams', () => {
        expect(
            searchToV3Filters({ orgUnitParentId: '7', levels: '7' }).filters
                .ancestor_id__or_self,
        ).toBe('7');
    });

    it('maps geography none to neither a location nor a shape', () => {
        const { filters } = searchToV3Filters({ geography: 'none' });
        expect(filters.has_location).toBe(false);
        expect(filters.has_shape).toBe(false);
        expect(searchToV3Filters({ geography: 'any' }).filters).toEqual({
            validation_status__in: 'VALID',
        });
    });

    it('matches opening and closing dates exactly, like the search', () => {
        const { filters } = searchToV3Filters({
            opening_date: '05-01-2024',
        } as never);
        expect(filters.opening_date__gte).toBe('2024-01-05');
        expect(filters.opening_date__lte).toBe('2024-01-05');
    });

    it('bounds submission dates by whole days, whatever their format', () => {
        const { filters } = searchToV3Filters({
            dateFrom: '05-01-2024',
            dateTo: '2024-01-31 23:59',
        });
        expect(filters.instance__created_at__gte).toBe('2024-01-05 00:00');
        // already converted by useGetApiParams: as is
        expect(filters.instance__created_at__lte).toBe('2024-01-31 23:59');
    });

    it('lists what v3 cannot express', () => {
        expect(
            searchToV3Filters({ hasInstances: 'duplicates' }).unsupported,
        ).toEqual(['hasInstances']);
        // the search takes the source's default version
        const bySource = searchToV3Filters({ source: '1' });
        expect(bySource.filters.source_id).toBe('1');
        expect(bySource.unsupported).toEqual(['source']);
        expect(
            searchToV3Filters({ linkedTo: '5' } as never).unsupported,
        ).toEqual(['linkedTo']);
    });
});
