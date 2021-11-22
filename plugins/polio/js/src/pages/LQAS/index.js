import React, { useState, useCallback } from 'react';
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
import { MapComponent } from '../../components/MapComponent/MapComponent';
import {
    findLQASDataForShape,
    makeCampaignsDropDown,
    determineStatusForDistrict,
    // totalDistrictsEvaluatedPerRound,
    convertLQASDataToArray,
    getScopeStyle,
    findScope,
    sortDistrictsByName,
    lqasTableColumns,
} from './utils';
import {
    NIGER_ORG_UNIT_ID,
    districtColors,
    LQAS_STRICT_PASS,
    LQAS_LAX_PASS,
    LQAS_LAX_FAIL,
    LQAS_STRICT_FAIL,
} from './constants';
import { useLQAS } from './requests';
import { LqasPopup } from './LqasPopup';
import { LqasMapHeader } from './LqasMapHeader';

// Don't put it in utils to avoid circular dep
const makePopup = (LQASData, round) => shape => {
    return <LqasPopup shape={shape} LQASData={LQASData} round={round} />;
};

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
    const { data: LQASData, isLoading } = useLQAS(campaign);
    const { data: shapes = [] } = useGetGeoJson(NIGER_ORG_UNIT_ID, 'DISTRICT');
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: NIGER_ORG_UNIT_ID.toString(),
        }).query;
    const scope = findScope(campaign, campaigns, shapes);

    const districtsNotFound = LQASData.districts_not_found;

    const evaluatedRound1 = convertLQASDataToArray(LQASData, 'round_1');
    const evaluatedRound2 = convertLQASDataToArray(LQASData, 'round_2');

    const allStatusesRound1 = [...evaluatedRound1].map(district =>
        determineStatusForDistrict(district),
    );
    const allStatusesRound2 = [...evaluatedRound2].map(district =>
        determineStatusForDistrict(district),
    );
    const passedLqasStrictInRound1 = allStatusesRound1.filter(
        status => status === LQAS_STRICT_PASS,
    );
    const passedLqasStrictInRound2 = allStatusesRound2.filter(
        status => status === LQAS_STRICT_PASS,
    );
    const passedLqasLaxInRound1 = allStatusesRound1.filter(
        status => status === LQAS_LAX_PASS,
    );
    const passedLqasLaxInRound2 = allStatusesRound2.filter(
        status => status === LQAS_LAX_PASS,
    );
    const failedInRound1 = allStatusesRound1.filter(
        status => status === LQAS_LAX_FAIL || status === LQAS_STRICT_FAIL,
    );
    const failedInRound2 = allStatusesRound2.filter(
        status => status === LQAS_LAX_FAIL || status === LQAS_STRICT_FAIL,
    );

    const dropDownOptions = makeCampaignsDropDown(campaigns);
    const getShapeStylesRound1 = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape(shape, LQASData, 'round_1'),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [LQASData, scope],
    );
    const getShapeStylesRound2 = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape(shape, LQASData, 'round_2'),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [LQASData, scope],
    );

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
                            {districtsNotFound?.join(', ')}
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box ml={2}>
                                <LqasMapHeader
                                    round="round_1"
                                    evaluated={evaluatedRound1.length}
                                    passedStrict={
                                        passedLqasStrictInRound1.length
                                    }
                                    passedLax={passedLqasLaxInRound1.length}
                                    failed={failedInRound1.length}
                                />
                                <MapComponent
                                    name="LQASMapRound1"
                                    mainLayer={shapes}
                                    onSelectShape={() => null}
                                    getMainLayerStyle={getShapeStylesRound1}
                                    tooltipLabels={{
                                        main: 'District',
                                        background: 'Region',
                                    }}
                                    makePopup={makePopup(LQASData, 'round_1')}
                                    height={600}
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box mr={2}>
                                <LqasMapHeader
                                    round="round_2"
                                    evaluated={evaluatedRound2.length}
                                    passedStrict={
                                        passedLqasStrictInRound2.length
                                    }
                                    passedLax={passedLqasLaxInRound2.length}
                                    failed={failedInRound2.length}
                                />
                                <MapComponent
                                    name="LQASMapRound2"
                                    mainLayer={shapes}
                                    onSelectShape={() => null}
                                    getMainLayerStyle={getShapeStylesRound2}
                                    tooltipLabels={{
                                        main: 'District',
                                        background: 'Region',
                                    }}
                                    makePopup={makePopup(LQASData, 'round_2')}
                                    height={600}
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
