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

const fieldMapping: { [key: string]: string } = {
    opening_date: 'openingDate',
    closed_date: 'closedDate',
};

const conditionalFields = [
    { key: 'possible_types', name: 'possibleTypeIds' },
    { key: 'possible_parent_types', name: 'possibleParentTypeIds' },
    { key: 'group_sets', name: 'groupSetIds' },
    { key: 'editable_reference_forms', name: 'editableReferenceFormIds' },
    { key: 'other_groups', name: 'otherGroupIds' },
];

export const computeEditableFields = (
    data: OrgUnitChangeRequestConfigurationFull,
): string[] => {
    const editableFields: string[] = (data.editable_fields || []).map(field => {
        return fieldMapping[field] || field;
    });

    conditionalFields.forEach(({ key, name }) => {
        if ((data[key] ?? []).length > 0) {
            editableFields.push(name);
        }
    });

    return editableFields;
};
const mapAndJoin = (items: any[] = []) => items?.map(item => item.id).join(',');
export const useRetrieveOrgUnitChangeRequestConfig = (
    configId?: number,
): UseQueryResult<OrgUnitChangeRequestConfigurationForm, Error> => {
    const url = `${apiUrlOUCRC}${configId}/`;
    return useSnackQuery({
        queryKey: ['useRetrieveOrgUnitChangeRequestConfig', configId],
        queryFn: () => retrieveOrgUnitChangeRequestConfig(url),
        options: {
            enabled: Boolean(configId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: (data: OrgUnitChangeRequestConfigurationFull) => {
                return {
                    projectId: data.project.id,
                    orgUnitTypeId: data.org_unit_type.id,
                    orgUnitsEditable: data.org_units_editable,
                    editableFields: computeEditableFields(data).join(','),
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
