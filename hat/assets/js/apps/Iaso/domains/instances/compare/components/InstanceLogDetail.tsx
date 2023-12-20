/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
} from 'bluesquare-components';

import { Box, Paper } from '@mui/material';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import { useGetFormDescriptor } from '../hooks/useGetInstanceLogs';

import { InstanceLogContentBasic } from './InstanceLogContentBasic';

import MESSAGES from '../messages';

type Props = {
    instanceLogContent: any;
    isLogDetailLoading: boolean;
    isLogDetailError: boolean;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({
    instanceLogContent,
    isLogDetailLoading,
    isLogDetailError,
}) => {
    const {
        data: instanceLogDescriptor,
        isLoading: isLogDescriptorLoading,
        isError: isLogDescriptorError,
    } = useGetFormDescriptor(instanceLogContent?.logA?.form);

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const hasError = isLogDetailError || isLogDescriptorError;
    const isLoading = isLogDetailLoading || isLogDescriptorLoading;
    return (
        <>
            {hasError && (
                <ErrorPaperComponent
                    message={formatMessage(MESSAGES.errorLog)}
                />
            )}
            <Paper>
                {isLoading && (
                    <Box height="30vh">
                        <LoadingSpinner
                            fixed={false}
                            transparent
                            padding={4}
                            size={25}
                        />
                    </Box>
                )}
                {!hasError && !isLoading && instanceLogContent && (
                    <InstanceLogContentBasic
                        fileContent={instanceLogContent}
                        fileDescriptor={instanceLogDescriptor}
                    />
                )}
            </Paper>
        </>
    );
};
