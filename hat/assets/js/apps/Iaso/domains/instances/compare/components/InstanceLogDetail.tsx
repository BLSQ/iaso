/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';

import { useGetInstanceLogDetail } from '../hooks/useGetInstanceLogs';

import { FileContent } from '../../types/instance';

import { InstanceLogContentBasic } from './InstanceLogContentBasic';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';

type Props = {
    logA: string | undefined;
    logB: string | undefined;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({ logA, logB }) => {
    const {
        data: instanceLogDetail,
        isLoading,
        isError,
    }: {
        data?: FileContent;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logA, logB);

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

    // TO DO: add specific errors if instanceId does not exist or if log id does not exist
    if (isError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    }

    return (
        <>
            {instanceLogDetail && (
                // TO DO: add fileDescriptor prop to get label from label key
                <InstanceLogContentBasic fileContent={instanceLogDetail} />
            )}
        </>
    );
};
