import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import { OrgUnitChangeRequestConfigurationForm, OrgUnitChangeRequestConfigurationFull } from '../../types';

const retrieveOrgUnitChangeRequestConfig = (url: string) => {
    return getRequest(url) as Promise<OrgUnitChangeRequestConfigurationFull>;
};

export const useRetrieveOrgUnitChangeRequestConfig = (
    configId?: number,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onSuccess: (data: any) => void = _data => {},
): UseQueryResult<OrgUnitChangeRequestConfigurationForm, Error> => {
    const url = `${apiUrlOUCRC}${configId}`;
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
                return {
                    projectId: data.project.id,
                    orgUnitTypeId: data.org_unit_type.id,
                    orgUnitsEditable: data.org_units_editable,
                    editableFields: data.editable_fields,
                    possibleTypeIds: data?.possible_types
                        ?.map(type => {
                            return type.id;
                        })
                        .join(','),
                    possibleParentTypeIds: data?.possible_parent_types
                        ?.map(type => {
                            return type.id;
                        })
                        .join(','),
                    groupSetIds: data?.group_sets
                        ?.map(type => {
                            return type.id;
                        })
                        .join(','),
                    editableReferenceFormIds: data?.editable_reference_forms
                        ?.map(type => {
                            return type.id;
                        })
                        .join(','),
                    otherGroupIds: data?.other_groups
                        ?.map(type => {
                            return type.id;
                        })
                        .join(','),
                };
            },
        },
    });
};
