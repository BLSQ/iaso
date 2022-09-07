/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import { Box } from '@material-ui/core';

import { useGetCampaignLogDetail } from '../../hooks/useGetCampaignHistory';

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

    const getValue = (valueType, value) => {
        switch (valueType) {
            // iterate inside rounds object and show keys/values
            case 'object':
                return 'TO DO';

            case 'boolean':
                return value.toString();

            default:
                return value;
        }
    };

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
                <Box pl={8}>
                    {Object.entries(campaignLogDetail).map(([key, value]) => {
                        if (value !== null) {
                            return (
                                <div key={key}>
                                    <span style={{ marginRight: '8px' }}>
                                        {key} :{' '}
                                    </span>

                                    <span>{getValue(typeof value, value)}</span>
                                </div>
                            );
                        }
                    })}
                </Box>
            )}
        </>
    );
};
