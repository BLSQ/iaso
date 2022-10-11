/* eslint-disable camelcase */
import React, { useState, useEffect, FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { useSelector, useDispatch } from 'react-redux';

import { Box, Grid, makeStyles, Theme } from '@material-ui/core';

import { CampaignLogDetail } from './CampaignLogDetail';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import {
    CAMPAIGN_HISTORY_URL,
    DASHBOARD_BASE_URL,
} from '../../constants/routes';

import MESSAGES from '../../constants/messages';
import { useGetCampaignLogs } from '../../hooks/useGetCampaignHistory';

type RouterCustom = {
    prevPathname?: string;
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

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const CampaignHistory: FunctionComponent<Props> = ({
    params,
    router,
}) => {
    const {
        data: campaignLogsDropdown,
        isFetching: isFetchingCampaignLogsDropdown,
        isError,
    }: {
        data?: Record<string, any> | undefined;
        isFetching: boolean;
        isError: boolean;
    } = useGetCampaignLogs(params.campaignId);

    const { formatMessage } = useSafeIntl();

    const classes: Record<string, string> = useStyles();

    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();

    const [logIdInitialValue, setLogIdInitialValue] = useState<
        number | undefined
    >(undefined);

    const handleChange = (key, value) => {
        const newParams = {
            ...params,
            [key]: value,
        };
        dispatch(redirectToReplace(CAMPAIGN_HISTORY_URL, newParams));
    };

    useEffect(() => {
        if (campaignLogsDropdown && params.logId === undefined) {
            const defaultParams = {
                ...params,
                logId: campaignLogsDropdown[0]?.value,
            };
            dispatch(redirectToReplace(CAMPAIGN_HISTORY_URL, defaultParams));
        }
    }, [campaignLogsDropdown, params, dispatch]);

    useEffect(() => {
        setLogIdInitialValue(
            campaignLogsDropdown && campaignLogsDropdown[0]?.value,
        );
    }, [campaignLogsDropdown, isFetchingCampaignLogsDropdown]);

    if (isError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
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
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={4}>
                    <Grid xs={12} md={6} item>
                        <Box pl={6}>
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
                    </Grid>
                    <Grid container spacing={4}>
                        <Grid xs={12} md={6} item>
                            <Box pl={6}>
                                <CampaignLogDetail logId={params.logId} />
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
