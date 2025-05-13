/* eslint-disable react/no-array-index-key */
import React, { FunctionComponent } from 'react';
import { Grid, Box, Paper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { HorizontalDivider } from '../../../components/HorizontalDivider';
import MESSAGES from '../../../constants/messages';
import { Campaign, Sides } from '../../../constants/types';
import { useGetCampaigns } from '../../Campaigns/hooks/api/useGetCampaigns';
import { GraphTitle } from '../shared/charts/GraphTitle';
import { LqasImHorizontalChart } from '../shared/charts/LqasImHorizontalChart';
import { LqasImVerticalChart } from '../shared/charts/LqasImVerticalChart';
import { paperElevation } from '../shared/constants';
import { BadRoundNumbers } from '../shared/DebugInfo/BadRoundNumber';
import { DatesIgnored } from '../shared/DebugInfo/DatesIgnored';
import { DistrictsNotFound } from '../shared/DebugInfo/DistrictsNotFound';
import { Filters } from '../shared/Filters';
import { useSelectedRounds } from '../shared/hooks/useSelectedRounds';
import { useStyles } from '../shared/hooks/useStyles';
import { LqasImUrlParams } from '../types';
import { ImOverviewContainer } from './CountryOverview/ImOverviewContainer';
import { UseImData, useImData } from './hooks/useImData';
import { useImType } from './hooks/useImType';

export const ImStats: FunctionComponent = () => {
    const { url: baseUrl, type: imType } = useImType();
    const params = useParamsObject(baseUrl) as LqasImUrlParams;
    const { campaign, country } = params;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: country,
            enabled: Boolean(country),
            show_test: false,
            on_hold: true,
        }) as UseQueryResult<Campaign[], Error>;

    const { onRoundChange, selectedRounds, dropDownOptions } =
        useSelectedRounds({ baseUrl, campaigns, params });

    const {
        imData,
        isFetching,
        convertedData,
        debugData,
        hasScope,
        chartData,
    }: UseImData = useImData({ campaign, country, imType, selectedRounds });

    const countryId = country ? parseInt(country, 10) : undefined;

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
                            round={selectedRounds[0]}
                            campaign={campaign}
                            campaigns={campaigns}
                            countryId={countryId}
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
                            round={selectedRounds[1]}
                            campaign={campaign}
                            campaigns={campaigns}
                            countryId={countryId}
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
                            <DisplayIfUserHasPerm
                                permissions={['iaso_polio_config']}
                            >
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
                                            data={imData?.stats}
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
