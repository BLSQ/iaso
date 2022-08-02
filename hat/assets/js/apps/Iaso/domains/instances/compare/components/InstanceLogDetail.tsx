/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useEffect } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';

import {
    useGetInstanceLogDetail,
    useGetFormDescriptor,
} from '../hooks/useGetInstanceLogs';

import { InstanceLogContentBasic } from './InstanceLogContentBasic';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';

type Props = {
    logA: string | undefined;
    logB: string | undefined;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({ logA, logB }) => {
    const {
        data: instanceLogDetailA,
    }: // isLoading,
    // isError,
    {
        data?: Record<string, any> | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logA);

    const {
        data: instanceLogDetailB,
        isLoading,
        isError,
    }: {
        data?: Record<string, any> | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logB);

    const {
        data: instanceFormDescriptorA,
    }: {
        data?: Record<string, any> | undefined;
    } = useGetFormDescriptor(
        instanceLogDetailA?.json._version,
        instanceLogDetailA?.form,
    );

    const {
        data: instanceFormDescriptorB,
    }: {
        data?: Record<string, any> | undefined;
    } = useGetFormDescriptor(
        instanceLogDetailB?.json._version,
        instanceLogDetailB?.form,
    );

    const { formatMessage } = useSafeIntl();

    const [instanceLog, setInstanceLog] = useState<{
        form_descriptor: {
            logA: Record<string, any> | undefined;
            logB: Record<string, any> | undefined;
        };
        file_content: {
            logA: Record<string, any> | undefined;
            logB: Record<string, any> | undefined;
        };
    }>({
        form_descriptor: {
            logA: undefined,
            logB: undefined,
        },
        file_content: {
            logA: undefined,
            logB: undefined,
        },
    });

    useEffect(() => {
        if (
            instanceLogDetailA &&
            instanceFormDescriptorA &&
            instanceLogDetailB &&
            instanceFormDescriptorB
        ) {
            setInstanceLog({
                form_descriptor: {
                    logA: instanceFormDescriptorA,
                    logB: instanceFormDescriptorB,
                },
                file_content: {
                    logA: instanceLogDetailA.json,
                    logB: instanceLogDetailB.json,
                },
            });
        }
    }, [
        instanceLogDetailA,
        instanceFormDescriptorA,
        instanceLogDetailB,
        instanceFormDescriptorB,
    ]);

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
            {instanceLog.file_content && (
                <InstanceLogContentBasic
                    fileContent={instanceLog.file_content}
                />
            )}
        </>
    );
};
