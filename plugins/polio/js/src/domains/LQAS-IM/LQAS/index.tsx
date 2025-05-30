/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Grid, Box, Paper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { HorizontalDivider } from '../../../components/HorizontalDivider';
import MESSAGES from '../../../constants/messages';
import { Campaign, Sides } from '../../../constants/types';
import { baseUrls } from '../../../constants/urls';
import { useGetCampaigns } from '../../Campaigns/hooks/api/useGetCampaigns';
import { GraphTitle } from '../shared/charts/GraphTitle';
import { LqasImHorizontalChart } from '../shared/charts/LqasImHorizontalChart';
import { LqasImVerticalChart } from '../shared/charts/LqasImVerticalChart';
import { paperElevation } from '../shared/constants';
import { BadRoundNumbers } from '../shared/DebugInfo/BadRoundNumber';
import { DatesIgnored } from '../shared/DebugInfo/DatesIgnored';
import { DistrictsNotFound } from '../shared/DebugInfo/DistrictsNotFound';
import { Filters } from '../shared/Filters';
import { useLqasIm } from '../shared/hooks/api/useLqasIm';
import {
    useSelectedRounds,
    UseSelectedRoundsResult,
} from '../shared/hooks/useSelectedRounds';
import { useStyles } from '../shared/hooks/useStyles';
import { LqasImData, LqasImUrlParams } from '../types';
import { LqasOverviewContainer } from './CountryOverview/LqasOverviewContainer';
import { CaregiversTable } from './Graphs/CaregiversTable';
import { UseLQASData, useLqasData } from './hooks/useLqasData';

const baseUrl = baseUrls.lqasCountry;

export const Lqas = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as LqasImUrlParams;
    const { campaign, country } = params;

    const { data: LQASData, isFetching }: UseQueryResult<LqasImData> =
        useLqasIm('lqas', country);

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: country,
            enabled: Boolean(country),
            show_test: false,
            on_hold: true,
        }) as UseQueryResult<Campaign[], Error>;

    const {
        onRoundChange,
        selectedRounds,
        dropDownOptions,
    }: UseSelectedRoundsResult = useSelectedRounds({
        baseUrl,
        campaigns,
        params,
    });

    const { convertedData, debugData, hasScope, chartData }: UseLQASData =
        useLqasData({
            campaign,
            country,
            selectedRounds,
            LQASData,
        });
    const countryId = country ? parseInt(country, 10) : undefined;
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box mb={1}>
                    <Filters
                        isFetching={isFetching}
                        campaigns={campaigns}
                        campaignsFetching={campaignsFetching}
                        params={params}
                    />
                </Box>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={6} key={`round_${selectedRounds[0]}_${0}`}>
                        <LqasOverviewContainer
                            round={selectedRounds[0]}
                            campaign={campaign}
                            campaigns={campaigns}
                            countryId={countryId}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            onRoundChange={onRoundChange(0)}
                            options={dropDownOptions}
                            side={Sides.left}
                            params={params}
                        />
                    </Grid>
                    <Grid item xs={6} key={`round_${selectedRounds[1]}_${1}`}>
                        <LqasOverviewContainer
                            round={selectedRounds[1]}
                            campaign={campaign}
                            campaigns={campaigns}
                            countryId={countryId}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            onRoundChange={onRoundChange(1)}
                            options={dropDownOptions}
                            side={Sides.right}
                            params={params}
                        />
                    </Grid>
                </Grid>

                {campaign && !isFetching && (
                    <>
                        <HorizontalDivider
                            mt={6}
                            mb={4}
                            ml={-4}
                            mr={-4}
                            displayTrigger
                        />
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(MESSAGES.lqasPerRegion)}
                                    displayTrigger
                                />
                            </Grid>
                            {selectedRounds.map((rnd, index) => (
                                <Grid
                                    item
                                    xs={6}
                                    key={`horiz-chart-${rnd}_${index}`}
                                >
                                    <Paper elevation={paperElevation}>
                                        <LqasImHorizontalChart
                                            type="lqas"
                                            round={rnd}
                                            campaign={campaign}
                                            countryId={countryId}
                                            data={convertedData}
                                            isLoading={isFetching}
                                        />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <HorizontalDivider
                            mt={6}
                            mb={4}
                            ml={-4}
                            mr={-4}
                            displayTrigger
                        />
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsNoFingerMarked,
                                    )}
                                    displayTrigger={hasScope}
                                />
                            </Grid>
                            {chartData.nfm.map(d => (
                                <Grid item xs={6} key={d.chartKey}>
                                    <Paper elevation={paperElevation}>
                                        <Box p={2}>
                                            <LqasImVerticalChart
                                                data={d.data}
                                                chartKey={d.chartKey}
                                                title={d.title}
                                                isLoading={isFetching}
                                                showChart={Boolean(campaign)}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <HorizontalDivider
                            mt={6}
                            mb={4}
                            ml={0}
                            mr={0}
                            displayTrigger
                        />
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsForAbsence,
                                    )}
                                    displayTrigger={hasScope}
                                />
                            </Grid>
                            {chartData.rfa.map(d => (
                                <Grid item xs={6} key={d.chartKey}>
                                    <Paper elevation={paperElevation}>
                                        <Box p={2}>
                                            <LqasImVerticalChart
                                                data={d.data}
                                                chartKey={d.chartKey}
                                                title={d.title}
                                                isLoading={isFetching}
                                                showChart={Boolean(campaign)}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <HorizontalDivider
                            mt={6}
                            mb={4}
                            ml={-4}
                            mr={-4}
                            displayTrigger
                        />
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.caregivers_informed,
                                    )}
                                    displayTrigger
                                />
                            </Grid>
                            {chartData.cg.map(c => (
                                <Grid item xs={6} key={c.chartKey}>
                                    <CaregiversTable
                                        marginTop={false}
                                        campaign={campaign}
                                        round={c.round}
                                        data={convertedData}
                                        paperElevation={paperElevation}
                                        isLoading={campaignsFetching}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm
                                permissions={['iaso_polio_config']}
                            >
                                <HorizontalDivider
                                    mt={2}
                                    mb={4}
                                    ml={-4}
                                    mr={-4}
                                    displayTrigger
                                />
                                <Grid container item spacing={2}>
                                    <Grid item xs={4}>
                                        <DistrictsNotFound
                                            data={LQASData?.stats}
                                            campaign={campaign}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <DatesIgnored
                                            campaign={campaign}
                                            data={LQASData}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <BadRoundNumbers
                                            formsWithBadRoundNumber={
                                                LQASData?.stats[campaign]
                                                    ?.bad_round_number ?? 0
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </DisplayIfUserHasPerm>
                        )}
                    </>
                )}
            </Box>
        </>
    );
};
