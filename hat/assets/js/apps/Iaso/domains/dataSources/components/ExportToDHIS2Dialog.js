import React from 'react';
import { Grid } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import MESSAGES from '../messages';
import { useOrgUnitTypes } from '../requests';
import { orgUnitStatusAsOptions } from '../../../constants/filters';

const initialExportData = dataSourceId => ({
    source_version_id: dataSourceId ?? null, // version id of the origin data source
    source_org_unit_id: null,
    source_org_unit_types_ids: [],
    source_status: null, // "New", "Validated" etc, cf orgunit search
    fields_to_export: [],
    ref_version_id: null, // version id of the target data source
    credentials: null, // TODO ask if credentials should be prefilled
});

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

const dataSourceVersionsAsOptions = versions => {
    return versions.map(version => ({
        value: version.id,
        label: version.number.toString(),
    }));
};

export const ExportToDHIS2Dialog = ({
    renderTrigger,
    dataSourceId,
    dataSourceName,
    versions,
    credentials,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();
    const [exportData, setExportDataField] = useFormState(
        initialExportData(dataSourceId),
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
                            options={dataSourceVersionsAsOptions(versions)}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Treeview"
                            value={null}
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', valeu: 'test2' },
                            ]}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        {areOrgUnitTypesLoading && <LoadingSpinner />}
                        <InputComponent
                            type="select"
                            keyValue="source_org_unit_types_ids"
                            labelString="OU Types"
                            value={exportData.source_org_unit_types_ids.value}
                            errors={exportData.source_org_unit_types_ids.errors} // TODO actually manage errors
                            onChange={setExportDataField}
                            options={orgUnitTypes ?? []}
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
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', valeu: 'test2' },
                            ]}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="ref_version_id"
                            labelString="Data source ref"
                            value={exportData.ref_version_id.value}
                            errors={exportData.ref_version_id.errors}
                            onChange={setExportDataField}
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', valeu: 'test2' },
                            ]}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Treeview"
                            value={null}
                            options={[
                                { label: 'test', value: 'test' },
                                { label: 'teste2', valeu: 'test2' },
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
