import React, {
    useState,
    useEffect,
    FunctionComponent,
    useCallback,
} from 'react';

import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
    useRedirectToReplace,
    useGoBack,
} from 'bluesquare-components';

import { Box, Grid, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { CampaignLogDetail } from './CampaignLogDetail';

import WidgetPaper from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import {
    useGetCampaignLogs,
    useGetCampaignLogDetail,
    CampaignLogDetailResult,
    initialLogDetail,
} from './hooks/useGetCampaignHistory';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../../../constants/messages';

type Params = {
    campaignId: string;
    logId: string;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));
const baseUrl = baseUrls.campaignHistory;
const campaignUrl = baseUrls.campaigns;
export const CampaignHistory: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as unknown as Params;
    const goBack = useGoBack(campaignUrl);
    const redirectToReplace = useRedirectToReplace();
    const {
        data: campaignLogsDropdown,
        isFetching: isFetchingCampaignLogsDropdown,
    }: {
        data?: DropdownOptions<number>[];
        isFetching: boolean;
        isError: boolean;
    } = useGetCampaignLogs(params.campaignId);
    const {
        data: {
            user: campaignUser,
            logDetail: campaignLogDetail,
        } = initialLogDetail,
        isLoading: isCampaignLogLoading,
        isError: isCampaignLogError,
    }: {
        data?: CampaignLogDetailResult;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(initialLogDetail, params.logId);

    const [logIdInitialValue, setLogIdInitialValue] = useState<
        number | undefined
    >(undefined);

    const handleChange = useCallback(
        (key, value) => {
            const newParams = {
                ...params,
                [key]: value,
            };
            redirectToReplace(baseUrl, newParams);
        },
        [params, redirectToReplace],
    );

    useEffect(() => {
        if (campaignLogsDropdown && params.logId === undefined) {
            const defaultParams = {
                ...params,
                logId: `${campaignLogsDropdown[0]?.value}`,
            };
            redirectToReplace(baseUrl, defaultParams);
        }
    }, [campaignLogsDropdown, params, redirectToReplace]);

    useEffect(() => {
        setLogIdInitialValue(
            campaignLogsDropdown && campaignLogsDropdown[0]?.value,
        );
    }, [campaignLogsDropdown, isFetchingCampaignLogsDropdown]);

    if (isCampaignLogError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.campaignHistory)}
                displayBackButton
                goBack={goBack}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={4}>
                    <Grid xs={4} item>
                        <Box mt={2}>
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

                        {isCampaignLogLoading && (
                            <Box height="70vh">
                                <LoadingSpinner
                                    fixed={false}
                                    transparent
                                    padding={4}
                                    size={25}
                                />
                            </Box>
                        )}
                        <Box mt={2}>
                            <WidgetPaper
                                expandable
                                isExpanded
                                title={formatMessage(MESSAGES.infos)}
                                padded
                            >
                                <Typography variant="body1" color="inherit">
                                    {formatMessage(MESSAGES.last_modified_by)} :{' '}
                                    {campaignUser?.user_name}
                                </Typography>
                                <Typography variant="body1" color="inherit">
                                    {formatMessage(MESSAGES.obr_name)} :{' '}
                                    {campaignLogDetail?.obr_name}
                                </Typography>
                            </WidgetPaper>
                        </Box>
                    </Grid>
                    <Grid xs={12} item>
                        <Box mt={2}>
                            <WidgetPaper
                                expandable
                                isExpanded
                                title={formatMessage(MESSAGES.form)}
                                padded
                            >
                                <CampaignLogDetail logId={params.logId} />
                            </WidgetPaper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
