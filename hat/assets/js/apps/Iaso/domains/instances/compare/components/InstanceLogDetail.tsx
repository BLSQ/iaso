/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import {
    useGetInstanceLogDetail,
    useGetFormDescriptor,
} from '../hooks/useGetInstanceLogs';

import { FileContent, FormDescriptor } from '../../types/instance';
import { IntlFormatMessage } from '../../../../types/intl';

import { InstanceLogContentBasic } from './InstanceLogContentBasic';

import MESSAGES from '../messages';

type Props = {
    logA: string | undefined;
    logB: string | undefined;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({ logA, logB }) => {
    const {
        data: instanceLogContent,
        isLoading: isLogDetailLoading,
        isError: isLogDetailError,
    }: {
        data?: FileContent;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logA, logB);

    const {
        data: instanceLogDescriptor,
        isLoading: isLogDescriptorLoading,
        isError: isLogDescriptorError,
    }: {
        data?: FormDescriptor;
    } = useGetFormDescriptor(
        instanceLogContent?.logA?.json._version,
        instanceLogContent?.logA?.form,
    );

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    if (isLogDetailLoading || isLogDescriptorLoading)
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

    if (isLogDetailError || isLogDescriptorError) {
        return (
            <ErrorPaperComponent message={formatMessage(MESSAGES.errorLog)} />
        );
    }

    return (
        <>
            {instanceLogContent && (
                <InstanceLogContentBasic
                    fileContent={instanceLogContent}
                    fileDescriptor={instanceLogDescriptor}
                />
            )}
        </>
    );
};
