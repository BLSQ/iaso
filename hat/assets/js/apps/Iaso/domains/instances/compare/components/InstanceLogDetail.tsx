import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box, Typography } from '@material-ui/core';

import { ContactSupportOutlined } from '@material-ui/icons';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance, InstanceLog, InstanceLogData } from '../../types/instance';

import InstanceLogContent from './InstanceLogContent';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';
import { useGetInstanceLogDetail } from '../hooks/useGetInstanceLogs';

type Params = {
    logId: string | undefined;
};
type Props = {
    params: Params;
    instance: InstanceLogData | undefined;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({
    logId,
    formVersionId,
    params,
    instance,
}) => {
    const {
        data,
        isLoading,
        isError,
    }: {
        data?: InstanceLogData;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logId);

    const { formatMessage } = useSafeIntl();
    console.log('log id log detail', logId);
    console.log('instance log detail', instance);
    if (isLoading)
        return (
            <Box height="70vh">
                <LoadingSpinner
                    fixed={false}
                    transparent
                    padding={4}
                    size={25}
                />
            </Box>
        );
    if (isError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    }

    return (
        <>
            <Box mb={4}>
                <Typography variant="h5" color="secondary">
                    LOG
                </Typography>
            </Box>

            <WidgetPaper title={formatMessage(MESSAGES.submissionTitle)}>
                <InstanceFileContent instance={data} />
            </WidgetPaper>
        </>
    );
};
