import React, { FunctionComponent, useCallback } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import PageError from 'Iaso/components/errors/PageError';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPipelineDetails } from './hooks/useGetPipelineDetails';
import { useLaunchTask } from './hooks/useLaunchTask';
import { usePipelineParameters } from './hooks/usePipelineParameters';
import { MESSAGES } from './messages';

type PipelineDetailsParams = {
    pipelineId: string;
};
const styles: SxStyles = {
    root: {
        padding: 2,
        height: '93vh',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paper: {
        padding: 3,
        width: '400px',
    },
    title: {
        marginTop: 3,
        marginBottom: 3,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 3,
        display: 'flex',
        justifyContent: 'center',
    },
    currentValuesContainer: {
        marginTop: 2,
        padding: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
    },
    currentValues: {
        fontSize: '10px',
        margin: 0,
        overflow: 'auto',
    },
};

export const PipelineDetails: FunctionComponent = () => {
    const { pipelineId } = useParamsObject(
        baseUrls.pipelineDetails,
    ) as unknown as PipelineDetailsParams;
    const { formatMessage } = useSafeIntl();
    const {
        data: pipeline,
        isFetching,
        error,
    } = useGetPipelineDetails(pipelineId);
    // Use custom hook for parameter handling
    const { parameterValues, renderParameterInput } =
        usePipelineParameters(pipeline);
    const { mutate: launchTask } = useLaunchTask(
        pipelineId,
        pipeline?.currentVersion?.id,
    );

    // Handle form submission
    const handleSubmit = useCallback(() => {
        launchTask(parameterValues as any);
    }, [launchTask, parameterValues]);
    return (
        <>
            {isFetching && <LoadingSpinner absolute />}
            {error && (
                <Box>
                    <PageError
                        errorCode={`${error.status}`}
                        displayMenuButton
                        customMessage={error.details.error}
                    />
                </Box>
            )}
            {!error && <TopBar title={pipeline?.name ?? ''} />}
            {pipeline && (
                <Box sx={styles.root}>
                    <Paper sx={styles.paper}>
                        <Typography variant="h6" sx={styles.title}>
                            {formatMessage(MESSAGES.title)}
                        </Typography>

                        {!pipeline.currentVersion?.parameters && (
                            <Typography variant="body2" sx={styles.title}>
                                {formatMessage(MESSAGES.noParameters)}
                            </Typography>
                        )}
                        {pipeline.currentVersion?.parameters?.map(parameter => (
                            <Box key={parameter.name} sx={{ marginBottom: 2 }}>
                                {renderParameterInput(parameter)}
                            </Box>
                        ))}
                        <Box sx={styles.buttonContainer}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={isFetching}
                            >
                                {formatMessage(MESSAGES.confirm)}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </>
    );
};
