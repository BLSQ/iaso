/* eslint-disable camelcase */
import React, { useState, useEffect, FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { useSelector, useDispatch } from 'react-redux';

import { Box, Grid } from '@material-ui/core';

import { CampaignLogDetail } from './CampaignLogDetail';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import {
    redirectTo,
    redirectToReplace,
} from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import {
    CAMPAIGN_HISTORY_URL,
    DASHBOARD_BASE_URL,
} from '../../constants/routes';

import MESSAGES from '../../constants/messages';
import {
    useGetCampaignLogs,
    useGetCampaignLogDetail,
} from '../../hooks/useGetCampaignHistory';

type RouterCustom = {
    prevPathname: string | undefined;
};
type State = {
    routerCustom: RouterCustom;
};
type Params = {
    campaignId: string;
    logId: string;
};

type Router = {
    goBack: () => void;
};

type Props = {
    params: Params;
    router: Router;
};

export const CampaignHistory: FunctionComponent<Props> = ({
    params,
    router,
}) => {
    const {
        data: campaignHistoryDetail,
        isLoading,
        isError,
    }: {
        data?: Record<string, any> | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(params.logId);

    const { formatMessage } = useSafeIntl();

    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();

    const [logIdInitialValue, setLogIdInitialValue] = useState<
        number | undefined
    >(undefined);

    const {
        data: campaignLogsDropdown,
        isFetching: isFetchingCampaignLogsDropdown,
    } = useGetCampaignLogs(params.campaignId);

    const handleChange = (key, value) => {
        const newParams = {
            ...params,
            [key]: value,
        };
        dispatch(redirectTo(CAMPAIGN_HISTORY_URL, newParams));
    };

    useEffect(() => {
        if (campaignLogsDropdown) {
            if (params.logId === undefined) {
                const defaultParams = {
                    ...params,
                    logId: campaignLogsDropdown[0]?.value,
                };
                dispatch(redirectTo(CAMPAIGN_HISTORY_URL, defaultParams));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignLogsDropdown, params]);

    useEffect(() => {
        setLogIdInitialValue(
            campaignLogsDropdown && campaignLogsDropdown[0]?.value,
        );
    }, [campaignLogsDropdown, isFetchingCampaignLogsDropdown]);
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
        return <ErrorPaperComponent message="Error" />;
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.campaignHistory)}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(DASHBOARD_BASE_URL, {}));
                    }
                }}
            />

            <Grid container spacing={4}>
                <Grid xs={12} md={6} item>
                    <Box p={6}>
                        <InputComponent
                            type="select"
                            keyValue="logId"
                            onChange={handleChange}
                            value={params.logId || logIdInitialValue}
                            label={MESSAGES.campaingDropdownLabel}
                            options={campaignLogsDropdown}
                            loading={isFetchingCampaignLogsDropdown}
                        />
                    </Box>
                    <Box p={6}>
                        <CampaignLogDetail logId={params.logId} />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
