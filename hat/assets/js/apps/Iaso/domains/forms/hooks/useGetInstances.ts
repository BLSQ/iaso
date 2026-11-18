import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

// Only these fields are consumed by FormsFilterComponent (the only caller of
// this hook).
const REQUESTED_FIELDS = [
    'id',
    'form_id',
    'form_name',
    'latitude',
    'longitude',
];

export const useGetInstances = ({
    orgUnitId,
}: {
    orgUnitId?: string | number;
}) => {
    const params: Record<string, any> = {
        order: 'id',
        limit: '20000',
        fields: REQUESTED_FIELDS.join(','),
    };
    if (orgUnitId) {
        params.orgUnitId = orgUnitId;
    }

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['instances', params],
        () => getRequest(`/api/instances/?${queryString.toString()}`),
        undefined,
        { enabled: Boolean(orgUnitId) },
    );
};
