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
import { useGetCampaigns } from '../../Campaigns/hooks/api/useGetCampaigns.ts';
import { GraphTitle } from '../shared/charts/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../shared/charts/LqasImHorizontalChart.tsx';
import { LqasImVerticalChart } from '../shared/charts/LqasImVerticalChart.tsx';
import { paperElevation } from '../shared/constants.ts';
import { BadRoundNumbers } from '../shared/DebugInfo/BadRoundNumber.tsx';
import { DatesIgnored } from '../shared/DebugInfo/DatesIgnored.tsx';
import { DistrictsNotFound } from '../shared/DebugInfo/DistrictsNotFound.tsx';
import { Filters } from '../shared/Filters.tsx';

import { useSelectedRounds } from '../shared/hooks/useSelectedRounds.tsx';
import { useStyles } from '../shared/hooks/useStyles.ts';
import { ImOverviewContainer } from './CountryOverview/ImOverviewContainer.tsx';
import { useImData } from './hooks/useImData.ts';
import { useImType } from './hooks/useImType.ts';

export const ImStats = () => {
    const { url: baseUrl, type: imType } = useImType();
    const params = useParamsObject(baseUrl);
    const { campaign, country } = params;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: country,
            enabled: Boolean(country),
            show_test: false,
            on_hold: true,
        });

    const { onRoundChange, selectedRounds, dropDownOptions } =
        useSelectedRounds({ baseUrl, campaigns, params });

    const {
        imData,
        isFetching,
        convertedData,
        debugData,
        hasScope,
        chartData,
    } = useImData(campaign, country, imType, selectedRounds);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    isFetching={isFetching}
                    campaigns={campaigns}
                    campaignsFetching={campaignsFetching}
                    imType={imType}
                    params={params}
                />
                <Grid container spacing={2} direction="row">
                    <Grid
                        item
                        xs={6}
                        key={`IM-map-round round_${selectedRounds[0]}_${0}`}
                    >
                        <ImOverviewContainer
                            round={parseInt(selectedRounds[0], 10)}
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            type={imType}
                            params={params}
                            onRoundChange={onRoundChange(0)}
                            side={Sides.left}
                            options={dropDownOptions}
                        />
                    </Grid>
                    <Grid
                        item
                        xs={6}
                        key={`IM-map-round round_${selectedRounds[1]}_${1}`}
                    >
                        <ImOverviewContainer
                            round={parseInt(selectedRounds[1], 10)}
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            type={imType}
                            params={params}
                            side={Sides.right}
                            onRoundChange={onRoundChange(1)}
                            options={dropDownOptions}
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
                                    text={formatMessage(MESSAGES.imPerRegion)}
                                    displayTrigger={campaign}
                                />
                            </Grid>
                            {selectedRounds.map((rnd, index) => (
                                <Grid
                                    item
                                    xs={6}
                                    key={`IM-bar-chart ${rnd}_${index}`}
                                >
                                    <Paper elevation={paperElevation}>
                                        <LqasImHorizontalChart
                                            type={imType}
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
                        {imType === 'imIHH' && (
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
                                            text={formatMessage(
                                                MESSAGES.reasonsNoFingerMarked,
                                            )}
                                            displayTrigger={
                                                campaign && hasScope
                                            }
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
                                                        showChart={Boolean(
                                                            campaign,
                                                        )}
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
                                            displayTrigger={
                                                campaign && hasScope
                                            }
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
                                                        showChart={Boolean(
                                                            campaign,
                                                        )}
                                                    />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </>
                        )}
                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm permission="iaso_polio_config">
                                <HorizontalDivider
                                    mt={6}
                                    mb={4}
                                    ml={-4}
                                    mr={-4}
                                    displayTrigger
                                />
                                <Grid container item>
                                    <Grid item xs={4}>
                                        <DistrictsNotFound
                                            campaign={campaign}
                                            data={imData.stats}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <DatesIgnored
                                            campaign={campaign}
                                            data={imData}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <BadRoundNumbers
                                            formsWithBadRoundNumber={
                                                imData?.stats[campaign]
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
