import type { Geometry } from 'geojson';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import MESSAGES from '../../messages';

/** The `/api/v3/orgunits/` fields the map asks for (each only when requested) */
export type OrgUnitV3 = {
    id: number;
    simplified_geom?: Geometry | null;
    latitude?: number | null;
    longitude?: number | null;
};

/** Some org units from `/api/v3/orgunits/`, by id, with only the `fields` asked for. */
export const useOrgUnitsV3 = (
    ids: number[],
    fields: string[],
    enabled = true,
): UseQueryResult<Record<number, OrgUnitV3>> =>
    useSnackQuery(
        ['orgUnitsV3', ids, fields],
        async () => {
            const params = new URLSearchParams({
                id__in: ids.join(','),
                fields: fields.join(','),
                page_size: String(ids.length),
            });
            const { results } = await getRequest(
                `/api/v3/orgunits/?${params.toString().replaceAll('%2C', ',')}`,
            );
            return Object.fromEntries(
                (results as OrgUnitV3[]).map(orgUnit => [orgUnit.id, orgUnit]),
            );
        },
        MESSAGES.fetchOrgUnitError,
        { enabled: enabled && ids.length > 0 },
    );
