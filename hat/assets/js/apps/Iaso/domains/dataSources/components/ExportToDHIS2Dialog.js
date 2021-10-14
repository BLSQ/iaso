import React, { useCallback, useRef, useEffect, useState } from 'react';
import { string, number, object, arrayOf, func } from 'prop-types';
import { Grid, Box, Divider, Typography, makeStyles } from '@material-ui/core';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useMutation } from 'react-query';
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
    versionsAsOptionsWithSourceName,
} from '../utils';

const style = theme => ({
    noCreds: {
        color: theme.palette.error.main,
    },
    subtitle: {
        fontWeight: 'bold',
        color: theme.palette.primary.main,
    },
});

const useStyles = makeStyles(style);

const initialExportData = defaultVersionId => ({
    ref_version_id: defaultVersionId, // version id of the target data source
    ref_top_org_unit_id: null,

    ref_org_unit_type_ids: [],
    ref_status: 'ALL', // "New", "Validated" etc, cf orgunit search
    fields_to_export: [
        FIELDS_TO_EXPORT.name,
        FIELDS_TO_EXPORT.parent,
        FIELDS_TO_EXPORT.geometry,
    ],
    source_version_id: null, // version id of the origin data source
    source_top_org_unit_id: null,
});

export const ExportToDHIS2Dialog = ({
    renderTrigger,
    dataSourceName,
    versions,
    defaultVersionId,
    credentials,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
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
    ] = useFormState(initialExportData(defaultVersionId));

    const refDataVersionId = exportData?.ref_version_id?.value;
    const sourceDataVersionId = exportData?.source_version_id?.value;

    // these ref to enable resetting the treeview when datasource changes
    const refTreeviewResetControl = useRef(refDataVersionId);
    const sourceTreeviewResetControl = useRef(sourceDataVersionId);

    const reset = useCallback(() => {
        setExportData(initialExportData(defaultVersionId));
    }, [setExportData, defaultVersionId]);

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
            // eslint-disable-next-line no-restricted-globals
            const r = confirm(formatMessage(MESSAGES.dhis2ExportSure));
            if (r) {
                exportToDHIS2(convertFormStateToDict(exportData));
                closeDialog();
            }
        },
        [exportData, exportToDHIS2],
    );

    const allowConfirm =
        Boolean(exportData.source_version_id?.value) &&
        (Boolean(exportData.ref_status?.value) ||
            exportData.ref_status?.value === '') &&
        exportData.fields_to_export?.value.length > 0 &&
        Boolean(exportData.ref_version_id?.value);

    const allowConfirmExport = allowConfirm && credentials?.is_valid;

    // Reset Treeview when changing source datasource
    useEffect(() => {
        if (sourceTreeviewResetControl.current !== sourceDataVersionId) {
            sourceTreeviewResetControl.current = sourceDataVersionId;
        }
    }, [sourceDataVersionId]);

    // Reset Treeview when changing ref datasource
    useEffect(() => {
        if (refTreeviewResetControl.current !== refDataVersionId) {
            refTreeviewResetControl.current = refDataVersionId;
        }
    }, [refDataVersionId]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            onConfirm={onXlsPreview}
            onClosed={reset}
            confirmMessage={MESSAGES.csvPreview}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            allowConfirm={allowConfirm}
            titleMessage={{
                ...MESSAGES.exportDataSource,
                values: { dataSourceName },
            }}
            additionalButton
            additionalMessage={MESSAGES.export}
            onAdditionalButtonClick={onConfirm}
            allowConfimAdditionalButton={allowConfirmExport}
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
                                keyValue="ref_version_id"
                                labelString={formatMessage(MESSAGES.version)}
                                value={exportData.ref_version_id?.value}
                                errors={exportData.ref_version_id.errors}
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
                                            'ref_top_org_unit_id',
                                            value?.id ?? null,
                                        );
                                    }}
                                    version={refDataVersionId}
                                    titleMessage={formatMessage(
                                        MESSAGES.selectTopOrgUnit,
                                    )}
                                    resetTrigger={
                                        refTreeviewResetControl.current !==
                                        refDataVersionId
                                    }
                                    hardReset
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            labelString={formatMessage(MESSAGES.status)}
                            keyValue="ref_status"
                            value={exportData.ref_status?.value}
                            errors={exportData.ref_status.errors}
                            onChange={setExportDataField}
                            options={orgUnitStatusAsOptions(formatMessage)}
                            required
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="ref_org_unit_type_ids"
                            labelString={formatMessage(MESSAGES.orgUnitTypes)}
                            value={exportData.ref_org_unit_type_ids?.value}
                            errors={exportData.ref_org_unit_type_ids.errors}
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
                        message={formatMessage(MESSAGES.sourceDataSource)}
                    />

                    <Grid xs={6} item>
                        <InputComponent
                            type="select"
                            keyValue="source_version_id"
                            labelString={formatMessage(
                                MESSAGES.datasourceSource,
                            )}
                            value={exportData.source_version_id.value}
                            errors={exportData.source_version_id.errors}
                            onChange={(keyValue, value) => {
                                setExportDataField(keyValue, value?.toString());
                            }}
                            options={versionsAsOptionsWithSourceName({
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
                                        'source_top_org_unit_id',
                                        value?.id ?? null,
                                    );
                                }}
                                version={sourceDataVersionId}
                                titleMessage={formatMessage(
                                    MESSAGES.selectTopOrgUnit,
                                )}
                                resetTrigger={
                                    sourceTreeviewResetControl.current !==
                                    sourceDataVersionId
                                }
                                disabled={!sourceDataVersionId}
                                hardReset
                            />
                        </Box>
                    </Grid>
                    <Grid xs={12} item>
                        <Box display="flex" alignItems="center">
                            <Typography
                                variant="subtitle1"
                                className={classes.subtitle}
                            >
                                {formatMessage(MESSAGES.credentialsForExport)}
                            </Typography>
                            {credentials?.is_valid && (
                                <Typography variant="body1">
                                    {credentials.name
                                        ? `: ${credentials.name} (${credentials.url})`
                                        : `: ${credentials.url}`}
                                </Typography>
                            )}
                            {!credentials?.is_valid && (
                                <Typography
                                    variant="body1"
                                    className={classes.noCreds}
                                >
                                    {`: ${formatMessage(
                                        MESSAGES.noCredentialsForExport,
                                    )}`}
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

ExportToDHIS2Dialog.propTypes = {
    renderTrigger: func.isRequired,
    dataSourceName: string.isRequired,
    versions: arrayOf(object).isRequired,
    defaultVersionId: number,
    credentials: object,
};

ExportToDHIS2Dialog.defaultProps = {
    defaultVersionId: null,
    credentials: null,
};
