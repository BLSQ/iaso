import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { VersionFields } from '../components/VersionPicker';
import { SyncResponse } from '../types/sync';

type SyncParams = {
    id: number;
    toUpdateFields: VersionFields;
    toCompareWithFields: VersionFields;
    fieldsToExport: string[];
};

const createJsonDiffAsync = async ({
    id,
    toUpdateFields,
    toCompareWithFields,
    fieldsToExport,
}: SyncParams): Promise<SyncResponse> => {
    const params: Record<string, any> = {};

    // Version to update
    if (toUpdateFields.status.value !== 'all') {
        params.source_version_to_update_validation_status =
            toUpdateFields.status.value;
    }

    if (toUpdateFields.orgUnit.value) {
        params.source_version_to_update_top_org_unit = parseInt(
            toUpdateFields.orgUnit.value,
            10,
        );
    }

    if (toUpdateFields.orgUnitTypes.value.length > 0) {
        params.source_version_to_update_org_unit_types =
            toUpdateFields.orgUnitTypes.value.map(outId => parseInt(outId, 10));
    }

    // Version to compare with
    if (toCompareWithFields.status.value !== 'all') {
        params.source_version_to_compare_with_validation_status =
            toCompareWithFields.status.value;
    }

    if (toCompareWithFields.orgUnit.value) {
        params.source_version_to_compare_with_top_org_unit = parseInt(
            toCompareWithFields.orgUnit.value,
            10,
        );
    }

    if (toCompareWithFields.orgUnitTypes.value.length > 0) {
        params.source_version_to_compare_with_org_unit_types =
            toCompareWithFields.orgUnitTypes.value.map(outId =>
                parseInt(outId, 10),
            );
    }

    // Options
    const nonEmptyFields = fieldsToExport.filter(
        field => field !== 'geometry' && field !== 'groups',
    );
    if (nonEmptyFields.length > 0) {
        params.field_names = nonEmptyFields;
    }

    params.ignore_groups = !fieldsToExport.includes('groups');
    params.show_deleted_org_units = false;

    return patchRequest(
        `/api/datasources/sync/${id}/create_json_diff/`,
        params,
    );
};

export const useCreateJsonDiffAsync = () => {
    return useSnackMutation<SyncResponse, Error, SyncParams>({
        mutationFn: ({
            id,
            toUpdateFields,
            toCompareWithFields,
            fieldsToExport,
        }) =>
            createJsonDiffAsync({
                id,
                toUpdateFields,
                toCompareWithFields,
                fieldsToExport,
            }),
        showSucessSnackBar: false,
    });
};
