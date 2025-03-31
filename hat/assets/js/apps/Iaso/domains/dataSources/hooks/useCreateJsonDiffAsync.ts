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
    console.log('sourceFields', sourceFields);
    console.log('targetFields', targetFields);
    console.log('fieldsToExport', fieldsToExport);
    const params = {
        // Version to update.
        source_version_to_update_validation_status:
            sourceFields.status.value !== 'all'
                ? sourceFields.status.value
                : undefined,
        source_version_to_update_top_org_unit: parseInt(
            sourceFields.orgUnit.value,
            10,
        ),
        source_version_to_update_org_unit_types:
            sourceFields.orgUnitTypes.value.map(outId => parseInt(outId, 10)),
        // Version to compare with.
        source_version_to_compare_with_validation_status:
            targetFields.status.value !== 'all'
                ? targetFields.status.value
                : undefined,
        source_version_to_compare_with_top_org_unit: parseInt(
            targetFields.orgUnit.value,
            10,
        ),
        source_version_to_compare_with_org_unit_types:
            targetFields.orgUnitTypes.value.map(outId => parseInt(outId, 10)),
        // Options.
        field_names: fieldsToExport,
        ignore_groups: true,
        show_deleted_org_units: false,
    };
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
