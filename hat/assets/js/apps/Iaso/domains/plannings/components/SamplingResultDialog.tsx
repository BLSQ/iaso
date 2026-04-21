import React, { FunctionComponent, useMemo } from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
} from '@mui/material';
import {
    IconButton,
    LoadingSpinner,
    makeFullModal,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';

import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';
import { useGetPipelineDetails } from 'Iaso/domains/openHexa/hooks/useGetPipelineDetails';
import {
    flattenHierarchy,
    useGetOrgUnitTypesHierarchy,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { ParameterValues } from 'Iaso/domains/plannings/sampling/customForms/LQASForm';
import { LQASRead } from 'Iaso/domains/plannings/sampling/customForms/LQASRead';
import { SxStyles } from 'Iaso/types/general';

import MESSAGES from '../messages';
import { Planning, SamplingResult } from '../types';

const styles: SxStyles = {
    parameters: {
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 240,
        overflow: 'auto',
        p: 1,
        borderRadius: 1,
        border: theme =>
            // @ts-ignore
            `1px solid ${theme.palette.border?.main ?? theme.palette.divider}`,
        bgcolor: theme => theme.palette.grey[50],
    },
    label: {
        color: 'text.secondary',
        fontWeight: 600,
    },
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    samplingResult: SamplingResult;
    planning: Planning;
};

const SamplingResultDialog: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    planning,
    samplingResult,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: pipeline, isFetching: isFetchingPipeline } =
        useGetPipelineDetails(isOpen ? samplingResult.pipeline_id : undefined);

    const { data: configData } = useGetPipelineConfig();
    const config = configData?.config || {};
    const lQAS_code = config?.lqas_pipeline_code;
    const isLqasPipeline = Boolean(
        lQAS_code && pipeline?.code && pipeline.code === lQAS_code,
    );
    const rawParameters = samplingResult.parameters;
    const hasParameters = Object.keys(rawParameters).length > 0;

    const { data: orgUnitTypeHierarchy, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypesHierarchy(
            planning.org_unit_details?.org_unit_type ?? undefined,
        );
    const orgunitTypes = useMemo(
        () => flattenHierarchy(orgUnitTypeHierarchy?.sub_unit_types || []),
        [orgUnitTypeHierarchy],
    );

    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            onClose={closeDialog}
            open={isOpen}
            scroll="body"
        >
            <DialogTitle color="primary">
                {samplingResult.group_details?.name ?? textPlaceholder}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item sm={6} xs={12}>
                        <Typography sx={styles.label} variant="body2">
                            {formatMessage(MESSAGES.created_at)}
                        </Typography>
                        <Typography variant="body1">
                            {DateTimeCell({
                                value: samplingResult.created_at,
                            })}
                        </Typography>
                    </Grid>
                    <Grid item sm={6} xs={12}>
                        <Typography sx={styles.label} variant="body2">
                            {formatMessage(MESSAGES.pipeline)}
                        </Typography>
                        <Typography variant="body1">
                            {samplingResult.pipeline_name || textPlaceholder}
                        </Typography>
                    </Grid>
                    <Grid item sm={6} xs={12}>
                        <Typography sx={styles.label} variant="body2">
                            {formatMessage(MESSAGES.orgUnitsCount)}
                        </Typography>
                        <Typography variant="body1">
                            {samplingResult.group_details?.org_unit_count ??
                                textPlaceholder}
                        </Typography>
                    </Grid>
                    <Grid item sm={6} xs={12}>
                        <Typography sx={styles.label} variant="body2">
                            {formatMessage(MESSAGES.samplingResultCreatedBy)}
                        </Typography>
                        <Typography variant="body1">
                            {samplingResult.created_by_details?.username ??
                                textPlaceholder}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography sx={styles.label} variant="body2">
                            {formatMessage(MESSAGES.samplingResultParameters)}
                        </Typography>
                        {isFetchingPipeline && (
                            <Box position="relative" minHeight={50}>
                                <LoadingSpinner absolute fixed={false} />
                            </Box>
                        )}
                        {!isFetchingPipeline && (
                            <>
                                {isLqasPipeline &&
                                    hasParameters &&
                                    !isFetchingOrgunitTypes && (
                                        <LQASRead
                                            orgunitTypes={orgunitTypes}
                                            parameterValues={
                                                rawParameters as ParameterValues
                                            }
                                        />
                                    )}
                                {!isLqasPipeline && hasParameters && (
                                    <Box component="pre" sx={styles.parameters}>
                                        {JSON.stringify(rawParameters, null, 2)}
                                    </Box>
                                )}
                                {!hasParameters && (
                                    <Typography variant="body1">
                                        {formatMessage(MESSAGES.noParameters)}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button color="primary" onClick={closeDialog} variant="text">
                    {formatMessage(MESSAGES.close)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ViewSamplingResultIconButton: FunctionComponent<{
    onClick: () => void;
    dataTestId?: string;
}> = ({ onClick, dataTestId }) => {
    return (
        <IconButton
            dataTestId={dataTestId}
            onClick={onClick}
            overrideIcon={InfoOutlined}
            tooltipMessage={MESSAGES.viewSamplingResultDetails}
        />
    );
};

const viewSamplingResultDialog = makeFullModal(
    SamplingResultDialog,
    ViewSamplingResultIconButton,
);

export { viewSamplingResultDialog as ViewSamplingResultDialog };
