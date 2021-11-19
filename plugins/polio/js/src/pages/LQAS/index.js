import React, { useState, useCallback } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import {
    useSafeIntl,
    Select,
    LoadingSpinner,
    // commonStyles,
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
    totalDistrictsEvaluatedPerRound,
    getBackgroundLayerStyle,
    defaultShapeStyle,
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

const makePopup = (LQASData, round) => shape => {
    return <LqasPopup shape={shape} LQASData={LQASData} round={round} />;
};

const styles = theme => ({
    // ...commonStyles(theme),
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
});

const useStyles = makeStyles(styles);

export const Lqas = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [campaign, setCampaign] = useState();
    const { data: LQASData, isLoading } = useLQAS(campaign);
    const { data: shapes } = useGetGeoJson(NIGER_ORG_UNIT_ID, 'DISTRICT');
    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: NIGER_ORG_UNIT_ID.toString(),
        }).query;
    // console.log('shapes', shapes);
    console.log('LQAS', LQASData);
    const districtsNotFound = LQASData.districts_not_found;
    // if (LQASData) {
    //     const testKeys = Object.keys(LQASData.stats);
    //     const test1 = Object.keys(LQASData.stats[testKeys[0]].round_2);
    //     const test2 = Object.keys(LQASData.stats[testKeys[1]].round_2);
    //     console.log(testKeys, test1, test2);
    // }
    const { evaluatedRound1, evaluatedRound2 } =
        totalDistrictsEvaluatedPerRound(LQASData);
    // console.log('eval R2', evaluatedRound2);
    const allStatusesRound1 = [...evaluatedRound1].map(districtName =>
        determineStatusForDistrict(
            findLQASDataForShape(districtName, LQASData, 'round_1'),
        ),
    );
    const allStatusesRound2 = [...evaluatedRound2].map(districtName =>
        determineStatusForDistrict(
            findLQASDataForShape(districtName, LQASData, 'round_2'),
        ),
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
                findLQASDataForShape(shape.name, LQASData, 'round_1'),
            );
            if (status) return districtColors[status];
            return defaultShapeStyle;
        },
        [LQASData],
    );
    const getShapeStylesRound2 = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape(shape.name, LQASData, 'round_2'),
            );
            if (status) return districtColors[status];
            return defaultShapeStyle;
        },
        [LQASData],
    );

    return (
        <div>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Grid
                container
                spacing={4}
                justifyContent="flex-start"
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
            <Grid container spacing={2} direction="row">
                <Grid item xs={6}>
                    {isLoading && <LoadingSpinner />}
                    {!isLoading && (
                        <Box ml={2}>
                            <LqasMapHeader
                                round="round_1"
                                evaluated={evaluatedRound1.size}
                                passedStrict={passedLqasStrictInRound1.length}
                                passedLax={passedLqasLaxInRound1.length}
                                failed={failedInRound1.length}
                            />
                            <MapComponent
                                name="LQASMapRound1"
                                mainLayer={shapes}
                                onSelectShape={() => null}
                                // backgroundLayer={shapes}
                                // getBackgroundLayerStyle={
                                //     getBackgroundLayerStyle
                                // }
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
                                evaluated={evaluatedRound2.size}
                                passedStrict={passedLqasStrictInRound2.length}
                                passedLax={passedLqasLaxInRound2.length}
                                failed={failedInRound2.length}
                            />
                            <MapComponent
                                name="LQASMapRound2"
                                mainLayer={shapes}
                                onSelectShape={() => null}
                                getMainLayerStyle={getShapeStylesRound2}
                                getBackgroundLayerStyle={
                                    getBackgroundLayerStyle
                                }
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
                <Grid item xs={12}>
                    <Box ml={2}>
                        <Typography variant="h6">
                            {`${formatMessage(MESSAGES.districtsNotFound)}:`}
                        </Typography>
                        {districtsNotFound}
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
};
