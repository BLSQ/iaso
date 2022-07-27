import React, { FunctionComponent, useState, useEffect } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';

import { InstanceLogData, FormDescriptor } from '../../types/instance';

import {
    useGetInstanceLogDetail,
    useGetFormDescriptor,
} from '../hooks/useGetInstanceLogs';

import InstanceFileContent from '../../components/InstanceFileContent';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';

type Props = {
    logId: string | undefined;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data: instanceLogDetail,
        isLoading,
        isError,
    }: {
        data?: InstanceLogData | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetInstanceLogDetail(logId);

    const {
        data: instanceFormDescriptor,
    }: {
        data?: FormDescriptor | undefined;
    } = useGetFormDescriptor(
        instanceLogDetail?.json._version,
        instanceLogDetail?.form,
    );

    const { formatMessage } = useSafeIntl();

    const [instanceLog, setInstanceLog] = useState<{
        form_descriptor: FormDescriptor | undefined;
        file_content: InstanceLogData | undefined;
    }>({
        form_descriptor: undefined,
        file_content: undefined,
    });

    useEffect(() => {
        if (instanceLogDetail && instanceFormDescriptor) {
            setInstanceLog({
                form_descriptor: instanceFormDescriptor,
                file_content: instanceLogDetail.json,
            });
        }
    }, [instanceLogDetail, instanceFormDescriptor]);

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
            {instanceLog.form_descriptor && instanceLog.file_content && (
                <WidgetPaper title={formatMessage(MESSAGES.submissionTitle)}>
                    <InstanceFileContent instance={instanceLog} logId={logId} />
                </WidgetPaper>
            )}
        </>
    );
};
