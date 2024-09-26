import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import {
    OrgUnitChangeRequestConfigurationForm,
    OrgUnitChangeRequestConfigurationFull,
} from '../../types';

const retrieveOrgUnitChangeRequestConfig = (url: string) => {
    return getRequest(url) as Promise<OrgUnitChangeRequestConfigurationFull>;
};

const mapAndJoin = (items: any[] = []) => items?.map(item => item.id).join(',');
export const useRetrieveOrgUnitChangeRequestConfig = (
    configId?: number,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onSuccess: (data: any) => void = _data => {},
): UseQueryResult<OrgUnitChangeRequestConfigurationForm, Error> => {
    const url = `${apiUrlOUCRC}${configId}/`;
    return useSnackQuery({
        queryKey: ['useRetrieveOrgUnitChangeRequestConfig', url],
        queryFn: () => retrieveOrgUnitChangeRequestConfig(url),
        options: {
            enabled: Boolean(configId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            onSuccess,
            select: (data: OrgUnitChangeRequestConfigurationFull) => {
                const editableFields: string[] = (
                    data.editable_fields || []
                ).map(field => {
                    if (field === 'opening_date') return 'openingDate';
                    if (field === 'closed_date') return 'closedDate';
                    return field;
                });
                if ((data?.possible_types ?? []).length > 0) {
                    editableFields.push('possibleTypeIds');
                }
                if ((data?.possible_parent_types ?? []).length > 0) {
                    editableFields.push('possibleParentTypeIds');
                }
                if ((data?.group_sets ?? []).length > 0) {
                    editableFields.push('groupSetIds');
                }
                if ((data?.editable_reference_forms ?? []).length > 0) {
                    editableFields.push('editableReferenceFormIds');
                }
                if ((data?.other_groups ?? []).length > 0) {
                    editableFields.push('otherGroupIds');
                }
                return {
                    projectId: data.project.id,
                    orgUnitTypeId: data.org_unit_type.id,
                    orgUnitsEditable: data.org_units_editable,
                    editableFields,
                    possibleTypeIds: mapAndJoin(data.possible_types),
                    possibleParentTypeIds: mapAndJoin(
                        data.possible_parent_types,
                    ),
                    groupSetIds: mapAndJoin(data.group_sets),
                    editableReferenceFormIds: mapAndJoin(
                        data.editable_reference_forms,
                    ),
                    otherGroupIds: mapAndJoin(data.other_groups),
                };
            },
        },
    });
};
