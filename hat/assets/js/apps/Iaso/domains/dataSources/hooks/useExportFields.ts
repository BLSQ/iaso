import { useMemo } from 'react';
import { useGetGroupDropdown } from 'Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { useGetOrgUnitValidationStatus } from 'Iaso/domains/orgUnits/hooks/utils/useGetOrgUnitValidationStatus';
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
    enableFetchGroups,
}) => {
    const {
        data: orgUnitStatusAsOptions,
        isLoading: isLoadingOrgUnitStatusAsOptions,
    } = useGetOrgUnitValidationStatus(true);
    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();

    const { data: groupsRef, isLoading: isLoadingGroupRef } =
        useGetGroupDropdown(
            { sourceVersionId: refDataVersionId },
            enableFetchGroups,
        );
    const { data: groupsSource, isLoading: isLoadingGroupSource } =
        useGetGroupDropdown(
            { sourceVersionId: sourceDataVersionId },
            enableFetchGroups && Boolean(sourceDataVersionId),
        );

    const toCompareWithFields: VersionFields = useMemo(
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
                disabled: !refDataVersionId,
            },
            group: {
                key: 'ref_org_unit_group_id',
                value: exportData.ref_org_unit_group_id?.value,
                errors: exportData.ref_org_unit_group_id.errors,
                options: groupsRef ?? [],
                isLoading: isLoadingGroupRef,
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
            groupsRef,
            isLoadingGroupRef,
        ],
    );
    const toUpdateFields: VersionFields = useMemo(
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
                disabled: !sourceDataVersionId,
            },
            group: {
                key: 'source_org_unit_group_id',
                value: exportData.source_org_unit_group_id?.value,
                errors: exportData.source_org_unit_group_id.errors,
                disabled: !sourceDataVersionId,
                options: groupsSource ?? [],
                isLoading: isLoadingGroupSource,
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
            groupsSource,
            isLoadingGroupSource,
        ],
    );

    return {
        toUpdateFields,
        toCompareWithFields,
        isLoadingOrgUnitStatusAsOptions,
        areOrgUnitTypesLoading,
    };
};
