import React, { useState, useCallback, useEffect } from 'react';
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
    findLQASDataForShape,
    makeCampaignsDropDown,
    determineStatusForDistrict,
    findLQASDataForDistrict,
    getScopeStyle,
    findScope,
    sortDistrictsByName,
    lqasTableColumns,
    getLqasStatsForRound,
} from './utils';
import { NIGER_ORG_UNIT_ID, districtColors } from './constants';
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
    const { data: shapes = [] } = useGetGeoJson(NIGER_ORG_UNIT_ID, 'DISTRICT');
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: NIGER_ORG_UNIT_ID.toString(),
        }).query;

    const scope = findScope(campaign, campaigns, shapes);

    const districtsNotFound = LQASData.districts_not_found?.join(', ');

    // evaluatedRound1 is still used in the Table
    const evaluatedRound1 = getLqasStatsForRound(LQASData, 'round_1')[0].map(
        district => {
            return {
                ...district,
                status: determineStatusForDistrict(
                    findLQASDataForDistrict(district, LQASData, 'round_1'),
                ),
            };
        },
    );

    // evaluatedRound2 is still used in the Table
    const evaluatedRound2 = getLqasStatsForRound(LQASData, 'round_2')[0].map(
        district => {
            return {
                ...district,
                status: determineStatusForDistrict(
                    findLQASDataForDistrict(district, LQASData, 'round_1'),
                ),
            };
        },
    );

    const dropDownOptions = makeCampaignsDropDown(campaigns);

    const getShapeStyles = useCallback(
        round => shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape(shape, LQASData, round),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [LQASData, scope],
    );

    // FIXME pre-select a campaign for the demo. this effect should be removed
    useEffect(() => {
        setCampaign('NIG-xxDS-03-2021');
    }, []);

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
                                    lqasData={LQASData}
                                    shapes={shapes}
                                    getShapeStyles={getShapeStyles('round_1')}
                                    round="round_1"
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box mr={2}>
                                <LqasMap
                                    lqasData={LQASData}
                                    shapes={shapes}
                                    getShapeStyles={getShapeStyles('round_2')}
                                    round="round_2"
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
                                    data={sortDistrictsByName(evaluatedRound1)}
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
                                    data={sortDistrictsByName(evaluatedRound2)}
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
