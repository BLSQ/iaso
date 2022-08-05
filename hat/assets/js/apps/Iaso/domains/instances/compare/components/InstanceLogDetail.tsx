/* eslint-disable camelcase */
import React, { FunctionComponent, useState, useEffect } from 'react';
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

    const [instanceLog, setInstanceLog] = useState<{
        // form_descriptor: {
        //     logA: Record<string, any> | undefined;
        //     logB: Record<string, any> | undefined;
        // };
        // file_content: {
        logA: Record<string, any> | undefined;
        logB: Record<string, any> | undefined;
        // };
    }>({
        // form_descriptor: {
        //     logA: undefined,
        //     logB: undefined,
        // },

        logA: undefined,
        logB: undefined,
    });

    useEffect(() => {
        instanceLogDetail?.logA || instanceLogDetail?.logB;
        setInstanceLog({
            // form_descriptor: {
            //     logA: instanceFormDescriptorA,
            //     logB: instanceFormDescriptorB,
            // },

            logA: instanceLogDetail?.logA,
            logB: instanceLogDetail?.logB,
        });
    }, [logA, logB]);

    console.log('instance log detail', instanceLogDetail);

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
            {instanceLog && (
                <InstanceLogContentBasic fileContent={instanceLog} />
            )}
        </>
    );
};
