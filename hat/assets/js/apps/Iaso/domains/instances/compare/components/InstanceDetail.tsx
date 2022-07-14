import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box, Typography } from '@material-ui/core';

import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';

import InstanceDetailsInfos from '../../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../../components/InstanceDetailsLocation';
import InstanceFileContent from '../../components/InstanceFileContent';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';

type Props = {
    instanceId: string | undefined;
    instance: Instance | undefined;
};

const InstanceDetail: FunctionComponent<Props> = ({ instanceId, instance }) => {
    const {
        data,
        isLoading,
        isError,
    }: { data?: Instance; isLoading: boolean; isError: boolean } =
        useGetInstance(instanceId);
    // let currentInstance;

    // if (instance && data) {
    //     currentInstance = data;
    // }

    const { formatMessage } = useSafeIntl();
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
                    {`${formatMessage(
                        MESSAGES.submissionTitle,
                    )} - ${instanceId}`}
                </Typography>
            </Box>
            <WidgetPaper
                expandable
                isExpanded={false}
                title={formatMessage(MESSAGES.infos)}
                padded
            >
                <InstanceDetailsInfos currentInstance={data} />
            </WidgetPaper>
            <WidgetPaper
                expandable
                isExpanded={false}
                title={formatMessage(MESSAGES.location)}
            >
                <InstanceDetailsLocation currentInstance={data} />
            </WidgetPaper>
            <WidgetPaper title={formatMessage(MESSAGES.form)}>
                <InstanceFileContent instance={data} />
            </WidgetPaper>
        </>
    );
};

export default InstanceDetail;
