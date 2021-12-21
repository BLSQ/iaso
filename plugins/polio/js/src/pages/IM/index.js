import React, { useState } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import {
    useSafeIntl,
    Select,
    LoadingSpinner,
    // Table,
} from 'bluesquare-components';

import { Grid, Box, makeStyles, Typography } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../constants/messages';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { determineStatusForDistrict, getImStatsForRound } from './utils';
import { useIM } from './requests';
import { ImMap } from './ImMap';
import {
    makeCampaignsDropDown,
    findCountryIds,
    findScope,
} from '../../utils/index';
import { convertAPIData } from '../../utils/LqasIm';
import { LqasImTable } from '../../components/LQAS-IM/LqasImTable';

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

export const ImStats = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [campaign, setCampaign] = useState();
    const { data: imData, isLoading } = useIM();
    // console.log('LQAS', imData);
    const convertedData = convertAPIData(imData);

    const countryIds = findCountryIds(imData);
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
        imData.stats[campaign]?.districts_not_found?.join(', ');

    const currentCountryName = imData.stats[campaign]?.country_name;

    const datesIgnored = imData.day_country_not_found
        ? imData.day_country_not_found[currentCountryName]
        : {};

    const round1Stats = getImStatsForRound(convertedData, campaign, 'round_1');
    const round2Stats = getImStatsForRound(convertedData, campaign, 'round_2');
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
                title={formatMessage(MESSAGES.im)}
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
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box ml={2}>
                                <LqasImTable
                                    data={tableDataRound1}
                                    tableKey="IM-Round1"
                                />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && (
                            <Box mr={2}>
                                <LqasImTable
                                    data={tableDataRound2}
                                    tableKey="IM-Round2"
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
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
