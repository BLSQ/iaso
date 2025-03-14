import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    FunctionComponent,
    ReactNode,
    useMemo,
} from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { arrayOf, func, number, object, string } from 'prop-types';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { ModalSubTitle } from '../../../components/forms/ModalSubTitle';
import { useFormState } from '../../../hooks/form';
import { useSnackMutation } from '../../../libs/apiHooks';
import {
    commaSeparatedIdsToStringArray,
    convertFormStateToDict,
} from '../../../utils/forms';
import { useGetValidationStatus } from '../../forms/hooks/useGetValidationStatus';
import { Version } from '../../orgUnits/types/dataSources';
import MESSAGES from '../messages';
import {
    csvPreview,
    postToDHIS2,
    useDataSourceForVersion,
    useDataSourceVersions,
    useOrgUnitTypes,
} from '../requests';
import {
    FIELDS_TO_EXPORT,
    dataSourceVersionsAsOptions,
    useFieldsToExport,
    versionsAsOptionsWithSourceName,
} from '../utils';
import { VersionPicker, VersionFields } from './VersionPicker';

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
    source_org_unit_type_ids: [],
    ref_status: 'all', // "New", "Validated" etc, cf orgunit search
    source_status: 'all', // "New", "Validated" etc, cf orgunit search
    fields_to_export: [
        FIELDS_TO_EXPORT.geometry,
        FIELDS_TO_EXPORT.name,
        FIELDS_TO_EXPORT.parent,
        FIELDS_TO_EXPORT.openingDate,
        FIELDS_TO_EXPORT.closedDate,
    ],
    source_version_id: null, // version id of the origin data source
    source_top_org_unit_id: null,
});

type Props = {
    renderTrigger: () => ReactNode;
    dataSourceName: boolean;
    versions: Version[];
    defaultVersionId?: number;
};

export const ExportToDHIS2Dialog: FunctionComponent<Props> = ({
    renderTrigger,
    dataSourceName,
    versions,
    defaultVersionId,
}) => {
    const {
        data: orgUnitStatusAsOptions,
        isLoading: isLoadingOrgUnitStatusAsOptions,
    } = useGetValidationStatus(true);
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const fieldsToExport = useFieldsToExport();

    const { data: orgUnitTypes, isLoading: areOrgUnitTypesLoading } =
        useOrgUnitTypes();

    const { data: sourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const { mutate: exportToDHIS2 } = useSnackMutation(
        postToDHIS2,
        MESSAGES.exportToDhis2Success,
        MESSAGES.exportToDhis2Error,
    );

    const [isCSVLoading, setIsCsvLoading] = useState(false);

    const [exportData, setExportDataField, , setExportData] = useFormState(
        initialExportData(defaultVersionId),
    );

    const sourceVersion = sourceVersions?.find(
        v => v.id.toString() === exportData.source_version_id.value,
    );
    const { data: source } = useDataSourceForVersion(sourceVersion);
    const credentials = source?.credentials;

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
            // eslint-disable-next-line no-restricted-globals,no-alert
            const r = confirm(formatMessage(MESSAGES.dhis2ExportSure));
            if (r) {
                exportToDHIS2(convertFormStateToDict(exportData));
                closeDialog();
            }
        },
        [exportData, exportToDHIS2, formatMessage],
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

    const sourceFields: VersionFields = useMemo(() => {
        return {
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
        };
    }, [
        refDataVersionId,
        exportData,
        versions,
        defaultVersionId,
        formatMessage,
        orgUnitStatusAsOptions,
        isLoadingOrgUnitStatusAsOptions,
        orgUnitTypes,
        areOrgUnitTypesLoading,
    ]);

    const targetFields: VersionFields = useMemo(() => {
        return {
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
        };
    }, [
        areOrgUnitTypesLoading,
        exportData,
        formatMessage,
        isLoadingOrgUnitStatusAsOptions,
        orgUnitStatusAsOptions,
        orgUnitTypes,
        sourceVersions,
        sourceDataVersionId,
    ]);
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
                    <VersionPicker
                        fields={sourceFields}
                        onChange={setExportDataField}
                        resetTrigger={
                            refTreeviewResetControl.current !== refDataVersionId
                        }
                    />
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
                            withMarginTop={false}
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

                    <VersionPicker
                        fields={targetFields}
                        onChange={setExportDataField}
                        resetTrigger={
                            sourceTreeviewResetControl.current !==
                            sourceDataVersionId
                        }
                    />
                    {credentials && (
                        <Grid xs={12} item>
                            <Box display="flex" alignItems="center">
                                <Typography
                                    variant="subtitle1"
                                    className={classes.subtitle}
                                >
                                    {formatMessage(
                                        MESSAGES.credentialsForExport,
                                    )}
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
                    )}
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
