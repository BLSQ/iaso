import React, { useState } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import {
    useSafeIntl,
    Select,
    LoadingSpinner,
    Table,
} from 'bluesquare-components';

import { Grid, Box, makeStyles, Typography } from '@material-ui/core';
import MESSAGES from '../../constants/messages';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import {
    makeCampaignsDropDown,
    determineStatusForDistrict,
    findScope,
    sortDistrictsByName,
    lqasTableColumns,
    getLqasStatsForRound,
    findCountryIds,
    convertLQASData,
} from './utils';
import { useLQAS } from './requests';
import { LqasMap } from './LqasMap';

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

export const Lqas = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [campaign, setCampaign] = useState();
    const { data: LQASData, isLoading } = useLQAS();
    // console.log('LQAS', LQASData);
    const convertedData = convertLQASData(LQASData);

    const countryIds = findCountryIds(LQASData);
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: countryIds.toString(),
        }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const { data: shapes = [] } = useGetGeoJson(
        countryOfSelectedCampaign,
        'DISTRICT',
    );
    const scope = findScope(campaign, campaigns, shapes);

    const districtsNotFound =
        LQASData.stats[campaign]?.districts_not_found?.join(', ');

    // evaluatedRound1 is still used in the Table
    const round1Stats = getLqasStatsForRound(
        convertedData,
        campaign,
        'round_1',
    );
    const round2Stats = getLqasStatsForRound(
        convertedData,
        campaign,
        'round_2',
    );
    const tableDataRound1 = round1Stats[0].map(district => {
        return {
            ...district,
            status: determineStatusForDistrict(district),
        };
    });

    const tableDataRound2 = round2Stats[0].map(district => {
        return {
            ...district,
            status: determineStatusForDistrict(district),
        };
    });

    const dropDownOptions = makeCampaignsDropDown(campaigns);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
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
                    <Grid item xs={6}>
                        <Box ml={2}>
                            <Typography variant="h6">
                                {`${formatMessage(
                                    MESSAGES.districtsNotFound,
                                )}:`}
                            </Typography>
                            {districtsNotFound}
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box ml={2}>
                                <LqasMap
                                    lqasData={convertedData}
                                    shapes={shapes}
                                    // getShapeStyles={getShapeStyles('round_1')}
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
                                <LqasMap
                                    lqasData={convertedData}
                                    shapes={shapes}
                                    // getShapeStyles={getShapeStyles('round_2')}
                                    round="round_2"
                                    campaign={campaign}
                                    scope={scope}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box ml={2}>
                                <Table
                                    data={sortDistrictsByName(tableDataRound1)}
                                    baseUrl=""
                                    columns={lqasTableColumns(formatMessage)}
                                    redirectTo={() => {}}
                                    params={{ page: 1, pageSize: 40 }}
                                    pages={1}
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box mr={2}>
                                <Table
                                    data={sortDistrictsByName(tableDataRound2)}
                                    baseUrl=""
                                    columns={lqasTableColumns(formatMessage)}
                                    redirectTo={() => {}}
                                    pages={1}
                                    params={{ page: 1, pageSize: 10 }}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
