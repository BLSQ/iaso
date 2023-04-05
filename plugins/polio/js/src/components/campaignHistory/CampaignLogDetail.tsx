import React, { FunctionComponent } from 'react';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box, Table, TableBody } from '@material-ui/core';

import {
    useGetCampaignLogDetail,
    CampaignLogDetailResult,
    initialLogDetail,
} from '../../hooks/useGetCampaignHistory';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';

import MESSAGES from '../../constants/messages';

import { useGetConfig } from './config';
import { useGetMapLog } from './useGetMapLog';
import { Head } from './Head';

type Props = {
    logId?: string;
};

export const CampaignLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data: { logDetail: campaignLogDetail } = initialLogDetail,
        isLoading,
        isError,
    }: {
        data?: CampaignLogDetailResult;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(initialLogDetail, logId);

    const { formatMessage } = useSafeIntl();
    const config = useGetConfig();
    const getMapLog = useGetMapLog(config);

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
            {campaignLogDetail && (
                <Table size="small">
                    <Head />
                    <TableBody>{getMapLog(campaignLogDetail)}</TableBody>
                </Table>
            )}
        </>
    );
};
