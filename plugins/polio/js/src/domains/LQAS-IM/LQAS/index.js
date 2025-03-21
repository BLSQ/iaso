/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Grid, Box, Paper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm.tsx';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject.tsx';
import { HorizontalDivider } from '../../../components/HorizontalDivider.tsx';
import MESSAGES from '../../../constants/messages.ts';
import { Sides } from '../../../constants/types.ts';
import { baseUrls } from '../../../constants/urls.ts';
import { useGetCampaigns } from '../../Campaigns/hooks/api/useGetCampaigns.ts';
import { GraphTitle } from '../shared/charts/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../shared/charts/LqasImHorizontalChart.tsx';
import { LqasImVerticalChart } from '../shared/charts/LqasImVerticalChart.tsx';
import { paperElevation } from '../shared/constants.ts';
import { BadRoundNumbers } from '../shared/DebugInfo/BadRoundNumber.tsx';
import { DatesIgnored } from '../shared/DebugInfo/DatesIgnored.tsx';
import { DistrictsNotFound } from '../shared/DebugInfo/DistrictsNotFound.tsx';
import { Filters } from '../shared/Filters.tsx';
import { useLqasIm } from '../shared/hooks/api/useLqasIm.ts';
import { useSelectedRounds } from '../shared/hooks/useSelectedRounds.tsx';
import { useStyles } from '../shared/hooks/useStyles.ts';
import { LqasOverviewContainer } from './CountryOverview/LqasOverviewContainer.tsx';
import { CaregiversTable } from './Graphs/CaregiversTable.tsx';
import { useLqasData } from './hooks/useLqasData.ts';

const baseUrl = baseUrls.lqasCountry;

export const Lqas = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const params = useParamsObject(baseUrl);
    const { campaign, country } = params;

    const { data: LQASData, isFetching } = useLqasIm('lqas', country);
    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: country,
            enabled: Boolean(country),
            show_test: false,
            on_hold: true,
        });

    const { onRoundChange, selectedRounds, dropDownOptions } =
        useSelectedRounds({ baseUrl, campaigns, params });
    const { convertedData, debugData, hasScope, chartData } = useLqasData({
        campaign,
        country,
        selectedRounds,
        LQASData,
    });

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
                        isLqas
                        params={params}
                    />
                </Box>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={6} key={`round_${selectedRounds[0]}_${0}`}>
                        <LqasOverviewContainer
                            round={parseInt(selectedRounds[0], 10)} // parsing the rnd because it will be a string when coming from params
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
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
                            round={parseInt(selectedRounds[1], 10)} // parsing the rnd because it will be a string when coming from params
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
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
                                            round={parseInt(rnd, 10)}
                                            campaign={campaign}
                                            countryId={parseInt(country, 10)}
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
                                        chartKey={c.chartKey}
                                        data={convertedData}
                                        paperElevation={paperElevation}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm permission="iaso_polio_config">
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
                                            data={LQASData.stats}
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
