import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

import { BaseLocation, Locations } from '../../types/locations';

const mapLocation = (orgUnits: OrgUnit[], baseOrgUnitId): Locations => {
    const locations: Locations = {
        shapes: [],
        markers: [],
    };
    if (!orgUnits) return locations;
    orgUnits.forEach((orgUnit: OrgUnit) => {
        const baseLocation: BaseLocation = {
            id: orgUnit.id,
            name: orgUnit.name,
            orgUnitTypeId: orgUnit.org_unit_type_id,
        };
        if (baseOrgUnitId !== orgUnit.id) {
            if (orgUnit.geo_json) {
                locations.shapes.push({
                    ...baseLocation,
                    geoJson: orgUnit.geo_json,
                });
            } else if (orgUnit.latitude && orgUnit.longitude) {
                locations.markers.push({
                    ...baseLocation,
                    latitude: orgUnit.latitude,
                    longitude: orgUnit.longitude,
                });
            }
        }
    });

    return locations;
};

export const useGetOrgUnitLocations = (
    orgUnitParentId: number | undefined,
): UseQueryResult<Locations, Error> => {
    const params = {
        validation_status: 'all',
        asLocation: true,
        limit: 5000,
        order: 'id',
        orgUnitParentId,
        geography: 'any',
    };

    const url = makeUrlWithParams('/api/orgunits', params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(orgUnitParentId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: (orgUnits: OrgUnit[]) =>
                mapLocation(orgUnits, orgUnitParentId),
        },
    );
};
