import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC, editableFieldsForBackend } from '../../constants';
import { OrgUnitChangeRequestConfigurationFull } from '../../types';

function cleanEditableFieldsForSaving(editableFields) {
    if (!editableFields) {
        return editableFields;
    }
    let cleanEditableFields = '';
    const splitFields = editableFields.split(',');
    for (const field in splitFields) {
        if (editableFieldsForBackend.includes(field)) {
            cleanEditableFields += `${field},`;
        }
    }
    if (cleanEditableFields.length) {
        cleanEditableFields = cleanEditableFields.slice(0, -1);
    }
    return cleanEditableFields;
}

function mapValuesForSaving(values) {
    const apiValues = {
        org_units_editable: values.orgUnitsEditable,
    };

    // These two fields can't be updated so they are only set for creation
    if (!values.id) {
       apiValues.project_id = values.projectId;
       apiValues.org_unit_type_id = values.orgUnitTypeId;
    }

    // This field must be cleaned because the backend accepts only some values
    const cleanedEditableFields = cleanEditableFieldsForSaving(values.editableFields);
    if (cleanedEditableFields) {
       apiValues.editable_fields = cleanedEditableFields;
    }

    // All the many to many fields are added if they have a value
    if (values.possibleTypeIds) {
       apiValues.possible_type_ids = values.possibleTypeIds.split(",").map(Number);
    }
    if (values.possibleParentTypeIds) {
       apiValues.possible_parent_type_ids = values.possibleParentTypeIds.split(",").map(Number);
    }
    if (values.groupSetIds) {
        apiValues.group_set_ids = values.groupSetIds.split(",").map(Number);
    }
    if (values.editableReferenceFormIds) {
        apiValues.editable_reference_form_ids = values.editableReferenceFormIds.split(",").map(Number);
    }
    if (values.otherGroupIds) {
        apiValues.other_group_ids = values.otherGroupIds.split(",").map(Number);
    }
    return apiValues;
};

const patchOrgUniType = async (body: Partial<OrgUnitChangeRequestConfigurationFull>) => {
    const url = `${apiUrlOUCRC}${body.id}/`;
    return patchRequest(url, body);
};

const postOrgUnitType = async (body: OrgUnitChangeRequestConfigurationFull) => {
    return postRequest({
        url: `${apiUrlOUCRC}`,
        data: body,
    });
};

export const useSaveOrgUnitChangeRequestConfiguration = (): UseMutationResult => {
    const ignoreErrorCodes = [400];
    return useSnackMutation({
        mutationFn: (data: Partial<OrgUnitChangeRequestConfigurationFull>) => {
            const formattedData = mapValuesForSaving(data);
            return formattedData.id
                ? patchOrgUniType(formattedData)
                : postOrgUnitType(formattedData as OrgUnitChangeRequestConfigurationFull);
        },
        // invalidateQueryKey: ['paginated-orgunit-types'],
        ignoreErrorCodes,
    });
};
