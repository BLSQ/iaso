import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box, Table, TableBody } from '@material-ui/core';

import { useGetCampaignLogDetail } from '../../hooks/useGetCampaignHistory';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';

import { Campaign } from '../../constants/types';
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import MESSAGES from '../../constants/messages';

import { config } from './config';
import { useGetMapLog } from './useGetMapLog';
import { Head } from './Head';

type Props = {
    logId?: string;
};

export type Result = {
    user: Profile;
    logDetail: Campaign;
};

export const CampaignLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data,
        isLoading,
        isError,
    }: {
        data?: Result | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(logId);

    const { logDetail: campaignLogDetail } = useMemo(() => {
        if (!data) {
            return { logDetail: undefined };
        }

        return data;
    }, [data]);

    const { formatMessage } = useSafeIntl();
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
