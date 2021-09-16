import React, { useCallback, useRef, useEffect } from 'react';
import { Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import MESSAGES from '../messages';
import { useDataSourceVersions, useOrgUnitTypes } from '../requests';
import { orgUnitStatusAsOptions } from '../../../constants/filters';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
} from '../../../utils/forms';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

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
    dataSourceId,
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

    const destinationDataVersionId = exportData.ref_version_id.value;

    // this ref to enable resetting the treeview whebn datasource changes
    const treeviewResetControl = useRef(destinationDataVersionId);

    const onTargetSourceVersionChange = useCallback(
        (keyValue, value) => {
            setExportDataField(keyValue, value?.toString());
        },
        [setExportDataField],
    );

    useEffect(() => {
        if (treeviewResetControl.current !== destinationDataVersionId) {
            treeviewResetControl.current = destinationDataVersionId;
        }
    }, [destinationDataVersionId]);

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
                            labelString="Version" // TODO add translation
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
                        <OrgUnitTreeviewModal
                            onConfirm={() => null}
                            source={dataSourceId}
                            titleMessage={MESSAGES.selectTopOrgUnit}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="source_org_unit_types_ids"
                            labelString="OU Types" // TODO add translation
                            value={exportData.source_org_unit_types_ids.value}
                            errors={exportData.source_org_unit_types_ids.errors} // TODO actually manage errors
                            onChange={(keyValue, newValue) => {
                                setExportDataField(
                                    keyValue,
                                    commaSeparatedIdsToArray(newValue),
                                );
                            }}
                            loading={areSourceVersionsLoading}
                            options={orgUnitTypes ?? []}
                            multi
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString="Status" // TODO add translation
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
                            labelString="Fields to export" // TODO add translation
                            value={exportData.fields_to_export.value}
                            errors={exportData.fields_to_export.errors}
                            onChange={(keyValue, newValue) => {
                                setExportDataField(
                                    keyValue,
                                    commaSeparatedIdsToStringArray(newValue),
                                );
                            }}
                            options={fieldsToExport}
                            multi
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="ref_version_id"
                            labelString="Data source ref" // TODO add translation
                            value={exportData.ref_version_id.value}
                            errors={exportData.ref_version_id.errors}
                            onChange={onTargetSourceVersionChange}
                            options={sourceVersions}
                            loading={areOrgUnitTypesLoading}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <OrgUnitTreeviewModal
                            onConfirm={value => console.log(value)}
                            version={destinationDataVersionId}
                            titleMessage={MESSAGES.selectTopOrgUnit}
                            resetTrigger={
                                treeviewResetControl.current !==
                                destinationDataVersionId
                            }
                            disabled={!destinationDataVersionId}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid xs={12} item>
                        <InputComponent
                            type="select"
                            keyValue="credentials"
                            labelString="Credentials" // TODO add translation
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
