import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC, mappingEditableFieldsForBackend } from '../../constants';
import { OrgUnitChangeRequestConfigurationForm } from '../../types';

const cleanEditableFieldsForSaving = (editableFields?: string): string[] => {
    if (!editableFields) {
        return [];
    }
    return editableFields.split(',').map(field => {
        return mappingEditableFieldsForBackend[field];
    });
};

// All the many to many fields are added if they have a value
const splitAndMapToNumbers = (str?: string) => {
    return str?.trim() ? str.split(',').map(Number) : [];
};

type ApiValues = {
    org_units_editable: boolean;
    project_id?: number;
    type?: string;
    org_unit_type_id?: number;
    editable_fields?: string[];
    possible_type_ids?: number[];
    possible_parent_type_ids?: number[];
    group_set_ids?: number[];
    editable_reference_form_ids?: number[];
    other_group_ids?: number[];
};

const mapValuesForSaving = (
    configId: number | undefined,
    values: OrgUnitChangeRequestConfigurationForm,
): ApiValues => {
    const apiValues: ApiValues = {
        org_units_editable: values.orgUnitsEditable ?? false,
    };
    // These two fields can't be updated so they are only set for creation
    if (!configId) {
        apiValues.project_id = values.projectId;
        apiValues.type = values.type;
        apiValues.org_unit_type_id = values.orgUnitTypeId;
    }

    // This field must be cleaned because the backend accepts only some values
    apiValues.editable_fields = cleanEditableFieldsForSaving(
        values.editableFields,
    );

    apiValues.possible_type_ids = splitAndMapToNumbers(values.possibleTypeIds);
    apiValues.possible_parent_type_ids = splitAndMapToNumbers(
        values.possibleParentTypeIds,
    );
    apiValues.group_set_ids = splitAndMapToNumbers(values.groupSetIds);
    apiValues.editable_reference_form_ids = splitAndMapToNumbers(
        values.editableReferenceFormIds,
    );
    apiValues.other_group_ids = splitAndMapToNumbers(values.otherGroupIds);
    return apiValues;
};

const patchOUCRC = async (configId: number, body: ApiValues): Promise<any> => {
    const url = `${apiUrlOUCRC}${configId}/`;
    return patchRequest(url, body);
};

const postOUCRC = async (body: ApiValues): Promise<any> => {
    return postRequest({
        url: `${apiUrlOUCRC}`,
        data: body,
    });
};

export const useSaveOrgUnitChangeRequestConfiguration =
    (): UseMutationResult => {
        const ignoreErrorCodes = [400];
        return useSnackMutation({
            mutationFn: ({
                configId,
                data,
            }: {
                configId: number | undefined;
                data: OrgUnitChangeRequestConfigurationForm;
            }) => {
                const formattedData = mapValuesForSaving(configId, data);
                return configId
                    ? patchOUCRC(configId, formattedData)
                    : postOUCRC(formattedData);
            },
            ignoreErrorCodes,
            invalidateQueryKey: [
                'useRetrieveOrgUnitChangeRequestConfig',
                'getOrgUnitChangeRequestConfigs',
                'checkAvailabilityOrgUnitChangeRequestConfigs',
            ],
        });
    };
