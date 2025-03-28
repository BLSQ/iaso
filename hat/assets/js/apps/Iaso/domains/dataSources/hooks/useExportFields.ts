import { useMemo } from 'react';
import { useGetValidationStatus } from '../../forms/hooks/useGetValidationStatus';
import { VersionFields } from '../components/VersionPicker';
import { useOrgUnitTypes } from '../requests';
import {
    dataSourceVersionsAsOptions,
    versionsAsOptionsWithSourceName,
} from '../utils';

export const useExportFields = ({
    exportData,
    versions,
    sourceVersions,
    defaultVersionId,
    formatMessage,
    refDataVersionId,
    sourceDataVersionId,
}) => {
    const {
        data: orgUnitStatusAsOptions,
        isLoading: isLoadingOrgUnitStatusAsOptions,
    } = useGetValidationStatus(true);
    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();

    const sourceFields: VersionFields = useMemo(
        () => ({
            version: {
                key: 'ref_version_id',
                value: refDataVersionId,
                errors: exportData.ref_version_id.errors,
                options: dataSourceVersionsAsOptions(
                    versions,
                    defaultVersionId,
                    formatMessage,
                ),
                required: true,
            },
            status: {
                key: 'ref_status',
                value: exportData.ref_status?.value,
                errors: exportData.ref_status.errors,
                options: orgUnitStatusAsOptions,
                required: true,
                isLoading: isLoadingOrgUnitStatusAsOptions,
            },
            orgUnitTypes: {
                key: 'ref_org_unit_type_ids',
                value: exportData.ref_org_unit_type_ids?.value,
                errors: exportData.ref_org_unit_type_ids.errors,
                options: orgUnitTypes ?? [],
                isLoading: areOrgUnitTypesLoading,
            },
            orgUnit: {
                key: 'ref_top_org_unit_id',
                value: exportData.ref_top_org_unit_id?.value,
                errors: exportData.ref_top_org_unit_id.errors,
            },
        }),
        [
            refDataVersionId,
            exportData,
            versions,
            defaultVersionId,
            formatMessage,
            orgUnitStatusAsOptions,
            isLoadingOrgUnitStatusAsOptions,
            orgUnitTypes,
            areOrgUnitTypesLoading,
        ],
    );

    const targetFields: VersionFields = useMemo(
        () => ({
            version: {
                key: 'source_version_id',
                value: sourceDataVersionId,
                errors: exportData.source_version_id.errors,
                options: versionsAsOptionsWithSourceName({
                    formatMessage,
                    versions: sourceVersions,
                }),
                required: true,
            },
            status: {
                key: 'source_status',
                value: exportData.source_status?.value,
                errors: exportData.source_status.errors,
                options: orgUnitStatusAsOptions,
                required: true,
                isLoading: isLoadingOrgUnitStatusAsOptions,
            },
            orgUnitTypes: {
                key: 'source_org_unit_type_ids',
                value: exportData.source_org_unit_type_ids?.value,
                errors: exportData.source_org_unit_type_ids.errors,
                options: orgUnitTypes ?? [],
                isLoading: areOrgUnitTypesLoading,
            },
            orgUnit: {
                key: 'source_top_org_unit_id',
                value: exportData.source_top_org_unit_id?.value,
                errors: exportData.source_top_org_unit_id.errors,
            },
        }),
        [
            sourceDataVersionId,
            exportData,
            formatMessage,
            sourceVersions,
            orgUnitStatusAsOptions,
            isLoadingOrgUnitStatusAsOptions,
            orgUnitTypes,
            areOrgUnitTypesLoading,
        ],
    );

    return {
        sourceFields,
        targetFields,
        isLoadingOrgUnitStatusAsOptions,
        areOrgUnitTypesLoading,
    };
};
