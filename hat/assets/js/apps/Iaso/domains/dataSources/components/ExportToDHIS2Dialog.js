import React, { useCallback, useRef, useEffect, useState } from 'react';
import { string, number, object, arrayOf, func } from 'prop-types';
import { Grid, Box, Divider, Typography } from '@material-ui/core';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useMutation } from 'react-query';
import { FormattedMessage } from 'react-intl';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import MESSAGES from '../messages';
import {
    useDataSourceVersions,
    useOrgUnitTypes,
    postToDHIS2,
    csvPreview,
} from '../requests';
import { orgUnitStatusAsOptions } from '../../../constants/filters';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
    convertFormStateToDict,
} from '../../../utils/forms';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { ModalSubTitle } from '../../../components/forms/ModalSubTitle';
import {
    useFieldsToExport,
    FIELDS_TO_EXPORT,
    dataSourceVersionsAsOptions,
    refDataSourceVersionsAsOptions,
} from '../utils';

const initialExportData = {
    source_version_id: null, // version id of the origin data source
    source_top_org_unit_id: undefined, // TODO should be null
    source_org_unit_types_ids: [],
    source_status: null, // "New", "Validated" etc, cf orgunit search
    fields_to_export: [
        FIELDS_TO_EXPORT.name,
        FIELDS_TO_EXPORT.parent,
        FIELDS_TO_EXPORT.geometry,
    ],
    ref_version_id: null, // version id of the target data source
    ref_top_org_unit_id: undefined, // TODO should be null
};

export const ExportToDHIS2Dialog = ({
    renderTrigger,
    dataSourceId,
    dataSourceName,
    versions,
    defaultVersionId,
    credentials,
}) => {
    console.log(credentials);
    const { formatMessage } = useSafeIntl();
    const fieldsToExport = useFieldsToExport();

    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();

    const { data: sourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const { mutate: exportToDHIS2 } = useMutation(postToDHIS2);

    const [isCSVLoading, setIsCsvLoading] = useState(false);

    const [
        exportData,
        setExportDataField,
        // eslint-disable-next-line no-unused-vars
        _setExportDataErrors,
        setExportData,
    ] = useFormState(initialExportData);

    const destinationDataVersionId = exportData.ref_version_id.value;

    // this ref to enable resetting the treeview when datasource changes
    const treeviewResetControl = useRef(destinationDataVersionId);

    const onTargetSourceVersionChange = useCallback(
        (keyValue, value) => {
            setExportDataField(keyValue, value?.toString());
        },
        [setExportDataField],
    );

    const reset = useCallback(() => {
        setExportData(initialExportData);
    }, [setExportData]);

    const onXlsPreview = useCallback(async () => {
        setIsCsvLoading(true);
        try {
            const csv = await csvPreview(convertFormStateToDict(exportData));
            const url = `${window.URL.createObjectURL(
                new File([csv], 'comparison.csv', { type: 'text/csv' }),
            )}`;
            window.location.href = url;
            // Not catching the error since it's already managed by snackbar
            // It still needs to be thrown by request to avoid prompting the download of an empty file
        } finally {
            setIsCsvLoading(false);
        }
    }, [exportData]);

    const onConfirm = useCallback(
        closeDialog => {
            console.log('SENDING TO DHIS2 (coming soon)');
            exportToDHIS2(convertFormStateToDict(exportData));
            closeDialog();
        },
        [exportData, exportToDHIS2],
    );

    const allowConfirm =
        Boolean(exportData.source_version_id.value) &&
        (Boolean(exportData.source_status.value) ||
            exportData.source_status.value === '') &&
        exportData.fields_to_export.value.length > 0 &&
        Boolean(exportData.ref_version_id.value);
    // TODO uncomment before merging
    // credentials?.is_valid;

    // Reset Treeview when changing ref datasource
    useEffect(() => {
        if (treeviewResetControl.current !== destinationDataVersionId) {
            treeviewResetControl.current = destinationDataVersionId;
        }
    }, [destinationDataVersionId]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            onConfirm={onXlsPreview}
            onClosed={reset}
            confirmMessage={MESSAGES.csvPreview} // TODO change message
            cancelMessage={MESSAGES.cancel}
            maxWidth="md"
            allowConfirm={allowConfirm}
            titleMessage={{
                ...MESSAGES.exportDataSource,
                values: { dataSourceName },
            }}
            additionalButton
            additionalMessage={MESSAGES.export}
            onAdditionalButtonClick={onConfirm}
        >
            <Grid container spacing={2}>
                {isCSVLoading && <LoadingSpinner />}
                {/* Data to export  */}
                <Grid container item spacing={2}>
                    <ModalSubTitle
                        message={formatMessage(MESSAGES.exportTitle)}
                    />
                    <Grid container item spacing={2}>
                        <Grid xs={6} item>
                            <InputComponent
                                type="select"
                                keyValue="source_version_id"
                                labelString={formatMessage(MESSAGES.version)}
                                value={exportData.source_version_id.value}
                                errors={exportData.source_version_id.errors}
                                onChange={setExportDataField}
                                options={dataSourceVersionsAsOptions(
                                    versions,
                                    defaultVersionId,
                                    formatMessage,
                                )}
                                required
                            />
                        </Grid>
                        <Grid xs={6} item>
                            <Box mb={2}>
                                <OrgUnitTreeviewModal
                                    onConfirm={value => {
                                        setExportDataField(
                                            'source_top_org_unit_id',
                                            value?.id, // TODO reset at null when API can handle it
                                        );
                                    }}
                                    source={dataSourceId}
                                    titleMessage={formatMessage(
                                        MESSAGES.selectTopOrgUnit,
                                    )}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString={formatMessage(MESSAGES.status)}
                            keyValue="source_status"
                            value={exportData.source_status.value}
                            errors={exportData.source_status.errors}
                            onChange={setExportDataField}
                            options={orgUnitStatusAsOptions(formatMessage)}
                            required
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="source_org_unit_types_ids"
                            labelString={formatMessage(MESSAGES.orgUnitTypes)}
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
                            keyValue="fields_to_export"
                            labelString={formatMessage(MESSAGES.fieldsToExport)}
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
                            required
                        />
                    </Grid>
                    <Grid xs={12} item>
                        <Divider />
                    </Grid>
                </Grid>
                {/* End data to export */}
                <Grid container item spacing={2}>
                    <ModalSubTitle
                        message={formatMessage(MESSAGES.targetDataSource)}
                    />

                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="ref_version_id"
                            labelString={formatMessage(MESSAGES.datasourceRef)}
                            value={exportData.ref_version_id.value}
                            errors={exportData.ref_version_id.errors}
                            onChange={onTargetSourceVersionChange}
                            options={refDataSourceVersionsAsOptions({
                                formatMessage,
                                versions: sourceVersions,
                            })}
                            loading={areOrgUnitTypesLoading}
                            required
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <Box mb={2}>
                            <OrgUnitTreeviewModal
                                onConfirm={value => {
                                    setExportDataField(
                                        'ref_top_org_unit_id',
                                        value?.id, // TODO reset at null when api can handle it
                                    );
                                }}
                                version={destinationDataVersionId}
                                titleMessage={formatMessage(
                                    MESSAGES.selectTopOrgUnit,
                                )}
                                resetTrigger={
                                    treeviewResetControl.current !==
                                    destinationDataVersionId
                                }
                                disabled={!destinationDataVersionId}
                            />
                        </Box>
                    </Grid>
                    <Grid xs={12} item>
                        <Box display="flex" alignItems="center">
                            <Typography variant="subtitle1">
                                {formatMessage(MESSAGES.credentialsForExport)}
                            </Typography>
                            {credentials?.is_valid && (
                                <Typography variant="body1">
                                    {credentials.name
                                        ? `${credentials.name}(${credentials.url})`
                                        : credentials.url}
                                </Typography>
                            )}
                            {!credentials?.is_valid && (
                                <FormattedMessage
                                    {...MESSAGES.noCredentialsForExport}
                                />
                            )}
                        </Box>
                        {/* <InputComponent
                            type="select"
                            keyValue="credentials"
                            labelString={formatMessage(MESSAGES.credentials)}
                            value={exportData.credentials.value}
                            errors={exportData.credentials.errors}
                            loading={areCredentialsLoading}
                            onChange={setExportDataField}
                            options={credentialsAsOptions(credentials)}
                        /> */}
                    </Grid>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

ExportToDHIS2Dialog.propTypes = {
    renderTrigger: func.isRequired,
    dataSourceId: number.isRequired,
    dataSourceName: string.isRequired,
    versions: arrayOf(object).isRequired,
    defaultVersionId: number,
    credentials: object,
};

ExportToDHIS2Dialog.defaultProps = {
    defaultVersionId: null,
    credentials: null,
};
