/* Tests for trypelim-specific Entity features */

import { useGetEntitiesApiParams } from './hooks/requests';

/* Test for the location type filter on org units */

describe('useGetEntitiesApiParams', () => {
    it('should map location to orgUnitId when location_type is registration', () => {
        const params: any = {
            location: '123',
            location_type: 'registration',
            tab: 'list',
        };
        const result = useGetEntitiesApiParams(params);
        expect(result.apiParams.orgUnitId).toBe('123');
        expect(result.apiParams.residentOrgUnitId).toBeUndefined();
    });
    it('should map location to residentOrgUnitId when location_type is residence', () => {
        const params: any = {
            location: '123',
            location_type: 'residence',
            tab: 'list',
        };
        const result = useGetEntitiesApiParams(params);
        expect(result.apiParams.residentOrgUnitId).toBe('123');
        expect(result.apiParams.orgUnitId).toBeUndefined();
    });

    it('should default to registration mapping when location_type is not provided', () => {
        const params: any = {
            location: '123',
            tab: 'list',
        };
        const result = useGetEntitiesApiParams(params);
        expect(result.apiParams.orgUnitId).toBe('123');
        expect(result.apiParams.residentOrgUnitId).toBeUndefined();
    });
});
