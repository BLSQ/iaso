import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../shared/hooks/useStyles';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../../constants/messages';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { Box, Grid } from '@mui/material';
import { NumberAsString, UuidAsString } from '../../../constants/types';
import { LqasTabValue } from '../types';
import { LqasCountryView } from './CountryOverview/LqasCountryView';
import { useLocation } from 'react-router-dom';
import { MainWrapper } from 'Iaso/components/MainWrapper';

export type LqasUrlParams = {
    accountId: string;
    leftCountry?: NumberAsString;
    rightCountry?: NumberAsString;
    leftCampaign?: UuidAsString;
    rightCampaign?: UuidAsString;
    leftMonth?: NumberAsString;
    rightMonth?: NumberAsString;
    leftYear?: NumberAsString;
    rightYear?: NumberAsString;
    leftRound?: NumberAsString;
    rightRound?: NumberAsString;
    leftTab?: LqasTabValue;
    rightTab?: LqasTabValue;
};

const baseUrl = baseUrls.lqasCountry;
const embeddedUrl = baseUrls.embeddedLqasCountry;

export const Lqas = () => {
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedUrl);
    const currentUrl = isEmbedded ? embeddedUrl : baseUrl;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(currentUrl) as LqasUrlParams;
    const {
        leftCountry,
        rightCountry,
        leftCampaign,
        rightCampaign,
        leftMonth,
        rightMonth,
        leftRound,
        rightRound,
        leftTab,
        rightTab,
    } = params;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <MainWrapper embedded={isEmbedded}>
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid container spacing={2} direction="row">
                        <Grid
                            item
                            xs={6}
                            key={`left-${leftCountry}-${leftCampaign}-${leftMonth}-${leftRound}-${leftTab}`}
                        >
                            <LqasCountryView
                                side="left"
                                params={params}
                                isEmbedded={isEmbedded}
                            />
                        </Grid>
                        <Grid
                            item
                            xs={6}
                            key={`right-${rightCountry}-${rightCampaign}-${rightMonth}-${rightRound}-${rightTab}`}
                        >
                            <LqasCountryView
                                side="right"
                                params={params}
                                isEmbedded={isEmbedded}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </MainWrapper>
        </>
    );
};
