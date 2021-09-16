import React, { useCallback } from 'react';
import { Grid } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import MESSAGES from '../messages';
import { useDataSourceVersions, useOrgUnitTypes } from '../requests';
import { orgUnitStatusAsOptions } from '../../../constants/filters';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

const useFieldsToExport = () => {
    const { formatMessage } = useSafeIntl();
    return [
        { label: formatMessage(MESSAGES.name), value: 'name' },
        { label: formatMessage(MESSAGES.parent), value: 'parent' },
        { label: formatMessage(MESSAGES.shape), value: 'shape' },
        { label: formatMessage(MESSAGES.groups), value: 'groups' },
        { label: formatMessage(MESSAGES.location), value: 'location' },
    ];
};

const initialExportData = {
    source_version_id: null, // version id of the origin data source
    source_org_unit_id: null,
    source_org_unit_types_ids: [],
    source_status: null, // "New", "Validated" etc, cf orgunit search
    fields_to_export: [],
    ref_version_id: null, // version id of the target data source
    credentials: null, // TODO ask if credentials should be prefilled
};

const credentialsAsOptions = credentials => {
    const options = [];
    if (credentials?.is_valid) {
        const { name, url, id } = credentials;
        let label = id;
        if (name) {
            label = name;
        } else if (url) {
            label = url;
        }
        options.push({ label, id });
    }
    return options;
};

const dataSourceVersionsAsOptions = (
    versions,
    defaultVersionId,
    formatMessage,
) => {
    const asDefault = `(${formatMessage(MESSAGES.default)})`;
    return versions.map(version => {
        const versionNumber = version.number.toString();
        return {
            value: version.id,
            label:
                version.id === defaultVersionId
                    ? `${versionNumber} ${asDefault}`
                    : versionNumber,
        };
    });
};

export const ExportToDHIS2Dialog = ({
    renderTrigger,
    // dataSourceId,
    dataSourceName,
    versions,
    credentials,
    defaultVersionId,
}) => {
    const { formatMessage } = useSafeIntl();
    const fieldsToExport = useFieldsToExport();
    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();
    const { data: sourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions(defaultVersionId);
    const [exportData, setExportDataField] = useFormState(initialExportData);
    const handleMultiSelect = useCallback(
        (keyValue, newValue) => {
            setExportDataField(keyValue, commaSeparatedIdsToArray(newValue));
        },
        [setExportDataField],
    );

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            onConfirm={() => null}
            titleMessage={formatMessage(MESSAGES.exportDataSource, {
                dataSourceName,
            })}
        >
            <>
                <Grid container spacing={4}>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="source_version_id"
                            labelString="Version"
                            value={exportData.source_version_id.value}
                            errors={exportData.source_version_id.errors}
                            onChange={setExportDataField}
                            options={dataSourceVersionsAsOptions(
                                versions,
                                defaultVersionId,
                                formatMessage,
                            )}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Treeview"
                            value={null}
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', value: 'test2' },
                            ]}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        {areSourceVersionsLoading && <LoadingSpinner />}
                        <InputComponent
                            type="select"
                            keyValue="source_org_unit_types_ids"
                            labelString="OU Types"
                            value={exportData.source_org_unit_types_ids.value}
                            errors={exportData.source_org_unit_types_ids.errors} // TODO actually manage errors
                            onChange={handleMultiSelect}
                            options={orgUnitTypes ?? []}
                            multi
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Status"
                            keyValue="source_status"
                            value={exportData.source_status.value}
                            errors={exportData.source_status.errors}
                            onChange={setExportDataField}
                            options={orgUnitStatusAsOptions(formatMessage)}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={12} item>
                        <InputComponent
                            type="select"
                            keyValue="fields_to_export"
                            labelString="Fields to export"
                            value={exportData.fields_to_export.value}
                            errors={exportData.fields_to_export.errors}
                            onChange={setExportDataField}
                            options={fieldsToExport}
                            multi
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={6} item>
                        {areOrgUnitTypesLoading && <LoadingSpinner />}
                        <InputComponent
                            type="select"
                            keyValue="ref_version_id"
                            labelString="Data source ref"
                            value={exportData.ref_version_id.value}
                            errors={exportData.ref_version_id.errors}
                            onChange={setExportDataField}
                            options={sourceVersions}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Treeview"
                            value={null}
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', value: 'test2' },
                            ]}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={12} item>
                        <InputComponent
                            type="select"
                            keyValue="credentials"
                            labelString="Credentials"
                            value={exportData.credentials.value}
                            errors={exportData.credentials.errors}
                            onChange={setExportDataField}
                            options={credentialsAsOptions(credentials)}
                        />
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
