import React, { useState } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Select } from 'bluesquare-components';

import { Grid, Box, makeStyles, Typography } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { oneOf } from 'prop-types';
import MESSAGES from '../../constants/messages';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { formatImDataForNFMChart } from './utils.ts';
import { useConvertedIMData, useIM } from './requests';
import { ImMap } from './ImMap';
import { makeCampaignsDropDown, findScope } from '../../utils/index';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { ImPercentageChart } from './ImPercentageChart.tsx';
import { findCountryIds } from '../../utils/LqasIm.tsx';

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
    const { data: convertedData } = useConvertedIMData(imType);
    const countryIds = findCountryIds(imData).toString();

    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: countryIds,
            enabled: Boolean(countryIds),
        }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const { data: shapes = [] } = useGetGeoJson(
        countryOfSelectedCampaign,
        'DISTRICT',
    );
    const scope = findScope(campaign, campaigns, shapes);

    const currentCountryName = imData.stats[campaign]?.country_name;

    const datesIgnored = imData.day_country_not_found
        ? imData.day_country_not_found[currentCountryName]
        : {};

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
                                loading={!countryIds || campaignsLoading}
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
                        <Box ml={2}>
                            <ImMap
                                imData={convertedData}
                                shapes={shapes}
                                round="round_1"
                                campaign={campaign}
                                scope={scope}
                                isLoading={isLoading}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2}>
                            <ImMap
                                imData={convertedData}
                                shapes={shapes}
                                round="round_2"
                                campaign={campaign}
                                scope={scope}
                                isLoading={isLoading}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={12}>
                        <Box ml={2} mt={2}>
                            <GraphTitle
                                text={formatMessage(MESSAGES.imPerRegion)}
                                displayTrigger={campaign}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box ml={2} mt={2}>
                            <ImPercentageChart
                                imType={imType}
                                round="round_1"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2} mt={2}>
                            <ImPercentageChart
                                imType={imType}
                                round="round_2"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                </Grid>
                {imType === 'imIHH' && (
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsNoFingerMarked,
                                    )}
                                    displayTrigger={campaign}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box ml={2} mt={2}>
                                <NoFingerMark
                                    data={nfmDataRound1}
                                    chartKey="nfmRound1"
                                    title={`${formatMessage(
                                        MESSAGES.childrenNoMark,
                                    )}, round 1: ${childrenNotMarkedRound1}`}
                                    isLoading={isLoading}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box mr={2} mt={2}>
                                <NoFingerMark
                                    data={nfmDataRound2}
                                    chartKey="nfmRound2"
                                    titel={`${formatMessage(
                                        MESSAGES.childrenNoMark,
                                    )}, round 2: ${childrenNotMarkedRound2}`}
                                    isLoading={isLoading}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                )}
                <DisplayIfUserHasPerm permission="iaso_polio_config">
                    <Grid container item>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <DistrictsNotFound
                                    campaign={campaign}
                                    data={imData.stats}
                                />
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
