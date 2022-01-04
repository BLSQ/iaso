import React, { useState, useMemo } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Select, LoadingSpinner } from 'bluesquare-components';

import { Grid, Box, makeStyles, Typography } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { oneOf } from 'prop-types';
import MESSAGES from '../../constants/messages';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { useGetRegions } from '../../hooks/useGetRegions';

import {
    formatImDataForChart,
    imTooltipFormatter,
    formatImDataForNFMChart,
} from './utils.ts';
import { useIM } from './requests';
import { ImMap } from './ImMap';
import {
    makeCampaignsDropDown,
    findCountryIds,
    findScope,
} from '../../utils/index';
import { convertAPIData } from '../../utils/LqasIm.ts';
import { PercentageBarChart } from '../../components/PercentageBarChart';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';

const styles = theme => ({
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
    // TODO use styling from commonStyles. overflow-x issue needs to be delat with though
    container: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: `calc(100vh - 65px)`,
        maxWidth: '100vw',
    },
});

const useStyles = makeStyles(styles);

export const ImStats = ({ imType }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [campaign, setCampaign] = useState();
    const { data: imData, isLoading } = useIM(imType);
    const convertedData = convertAPIData(imData);

    const countryIds = findCountryIds(imData);

    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: countryIds.toString(),
            enabled: countryIds.length,
        }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const { data: shapes = [] } = useGetGeoJson(
        countryOfSelectedCampaign,
        'DISTRICT',
    );
    const { data: regions = [] } = useGetRegions(countryOfSelectedCampaign);
    const scope = findScope(campaign, campaigns, shapes);

    const districtsNotFound =
        imData.stats[campaign]?.districts_not_found?.join(', ');

    const currentCountryName = imData.stats[campaign]?.country_name;

    const datesIgnored = imData.day_country_not_found
        ? imData.day_country_not_found[currentCountryName]
        : {};

    const imDataRound1 = useMemo(
        () =>
            formatImDataForChart({
                data: convertedData,
                campaign,
                round: 'round_1',
                shapes,
                regions,
            }),
        [convertedData, campaign, shapes, regions],
    );
    const imDataRound2 = useMemo(
        () =>
            formatImDataForChart({
                data: convertedData,
                campaign,
                round: 'round_2',
                shapes,
                regions,
            }),
        [convertedData, campaign, shapes, regions],
    );

    const nfmDataRound1 = formatImDataForNFMChart({
        data: imData.stats,
        campaign,
        round: 'round_1',
        formatMessage,
    });
    const nfmDataRound2 = formatImDataForNFMChart({
        data: imData.stats,
        campaign,
        round: 'round_2',
        formatMessage,
    });

    const childrenNotMarkedRound1 = nfmDataRound1
        .map(nfmData => nfmData.value)
        .reduce((total, current) => total + current, 0);

    const childrenNotMarkedRound2 = nfmDataRound2
        .map(nfmData => nfmData.value)
        .reduce((total, current) => total + current, 0);

    const dropDownOptions = makeCampaignsDropDown(campaigns);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Grid container className={classes.container}>
                <Grid
                    container
                    item
                    spacing={4}
                    justifyContent="space-between"
                    className={classes.filter}
                >
                    <Grid item xs={4}>
                        <Box ml={2}>
                            <Select
                                keyValue="campaigns"
                                label={formatMessage(MESSAGES.campaign)}
                                loading={campaignsLoading}
                                clearable
                                multi={false}
                                value={campaign}
                                options={dropDownOptions}
                                onChange={value => setCampaign(value)}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box ml={2}>
                                <ImMap
                                    imData={convertedData}
                                    shapes={shapes}
                                    round="round_1"
                                    campaign={campaign}
                                    scope={scope}
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box mr={2}>
                                <ImMap
                                    imData={convertedData}
                                    shapes={shapes}
                                    round="round_2"
                                    campaign={campaign}
                                    scope={scope}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    {campaign && (
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <Typography variant="h5">
                                    {formatMessage(MESSAGES.imPerRegion)}
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && campaign && (
                            <Box ml={2} mt={2}>
                                <Box>
                                    <Typography variant="h6">
                                        {formatMessage(MESSAGES.round_1)}
                                    </Typography>{' '}
                                </Box>
                                <PercentageBarChart
                                    data={imDataRound1}
                                    tooltipFormatter={imTooltipFormatter(
                                        formatMessage,
                                    )}
                                    chartKey="IMChartRound1"
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && campaign && (
                            <Box mr={2} mt={2}>
                                <Box>
                                    <Typography variant="h6">
                                        {formatMessage(MESSAGES.round_2)}
                                    </Typography>{' '}
                                </Box>
                                <PercentageBarChart
                                    data={imDataRound2}
                                    tooltipFormatter={imTooltipFormatter(
                                        formatMessage,
                                    )}
                                    chartKey="IMChartRound1"
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
                {imType === 'imIHH' && (
                    <Grid container item spacing={2} direction="row">
                        {campaign && (
                            <Grid item xs={12}>
                                <Box ml={2} mt={2}>
                                    <Typography variant="h5">
                                        {formatMessage(
                                            MESSAGES.reasonsNoFingerMarked,
                                        )}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                        <Grid item xs={6} mr={2}>
                            {isLoading && <LoadingSpinner />}
                            {!isLoading && campaign && (
                                <Box ml={2} mt={2}>
                                    <Box>
                                        <Typography variant="h6">
                                            {`${formatMessage(
                                                MESSAGES.childrenNoMark,
                                            )}, round 1: ${childrenNotMarkedRound1}`}
                                        </Typography>
                                    </Box>
                                    <NoFingerMark
                                        data={nfmDataRound1}
                                        chartKey="nfmRound1"
                                    />
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            {isLoading && <LoadingSpinner />}
                            {!isLoading && campaign && (
                                <Box mr={2} mt={2}>
                                    <Box>
                                        <Typography variant="h6">
                                            {`${formatMessage(
                                                MESSAGES.childrenNoMark,
                                            )}, round 2: ${childrenNotMarkedRound2}`}
                                        </Typography>
                                    </Box>
                                    <NoFingerMark
                                        data={nfmDataRound2}
                                        chartKey="nfmRound2"
                                    />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}
                <DisplayIfUserHasPerm permission="iaso_polio_config">
                    <Grid container item>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <Typography variant="h6">
                                    {`${formatMessage(
                                        MESSAGES.districtsNotFound,
                                    )}:`}
                                </Typography>
                                {districtsNotFound}
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <Typography variant="h6">
                                    {`${formatMessage(MESSAGES.datesIgnored)}:`}
                                </Typography>
                                {Object.keys(datesIgnored ?? {}).join(', ')}
                            </Box>
                        </Grid>
                    </Grid>
                </DisplayIfUserHasPerm>
            </Grid>
        </>
    );
};
ImStats.defaultProps = {
    imType: 'imGlobal',
};

ImStats.propTypes = { imType: oneOf(['imGlobal', 'imIHH', 'imOHH']) };
