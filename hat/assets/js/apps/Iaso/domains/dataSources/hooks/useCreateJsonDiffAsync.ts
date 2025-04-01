import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { VersionFields } from '../components/VersionPicker';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    id: number;
    sourceFields: VersionFields;
    targetFields: VersionFields;
    fieldsToExport: string[];
};

const createJsonDiffAsync = async ({
    id,
    sourceFields,
    targetFields,
    fieldsToExport,
}: SyncParams): Promise<SyncResponse> => {
    const params: Record<string, any> = {};

    // Version to update
    if (targetFields.status.value !== 'all') {
        params.source_version_to_update_validation_status =
            targetFields.status.value;
    }

    if (targetFields.orgUnit.value) {
        params.source_version_to_update_top_org_unit = parseInt(
            targetFields.orgUnit.value,
            10,
        );
    }

    if (targetFields.orgUnitTypes.value.length > 0) {
        params.source_version_to_update_org_unit_types =
            targetFields.orgUnitTypes.value.map(outId => parseInt(outId, 10));
    }

    // Version to compare with
    if (sourceFields.status.value !== 'all') {
        params.source_version_to_compare_with_validation_status =
            sourceFields.status.value;
    }

    if (sourceFields.orgUnit.value) {
        params.source_version_to_compare_with_top_org_unit = parseInt(
            sourceFields.orgUnit.value,
            10,
        );
    }

    if (sourceFields.orgUnitTypes.value.length > 0) {
        params.source_version_to_compare_with_org_unit_types =
            sourceFields.orgUnitTypes.value.map(outId => parseInt(outId, 10));
    }

    // Options
    const nonEmptyFields = fieldsToExport.filter(field => field !== 'geometry');
    if (nonEmptyFields.length > 0) {
        params.field_names = nonEmptyFields;
    }

    params.ignore_groups = true;
    params.show_deleted_org_units = false;

    return patchRequest(
        `/api/datasources/sync/${id}/create_json_diff/`,
        params,
    );
};

export const useCreateJsonDiffAsync = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({ id, sourceFields, targetFields, fieldsToExport }) =>
            createJsonDiffAsync({
                id,
                sourceFields,
                targetFields,
                fieldsToExport,
            }),
        showSucessSnackBar: false,
    });
};
