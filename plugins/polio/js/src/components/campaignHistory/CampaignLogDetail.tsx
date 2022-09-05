/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';

import { useGetCampaignLogDetail } from '../../hooks/useGetCampaignHistory';

import WidgetPaper from '../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';

import MESSAGES from '../../constants/messages';

type Props = {
    logId: string | undefined;
};

export const CampaignLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data: campaignLogDetail,
        isLoading,
        isError,
    }: {
        data?: Record<string, any> | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(logId);

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
            {campaignLogDetail && (
                <WidgetPaper title={formatMessage(MESSAGES.campaignHistory)}>
                    {Object.keys(campaignLogDetail).map(detail => (
                        <p>{detail}</p>
                    ))}
                </WidgetPaper>
            )}
        </>
    );
};
