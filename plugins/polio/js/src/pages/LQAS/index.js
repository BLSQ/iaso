import React, { useState, useMemo } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Select } from 'bluesquare-components';

import { Grid, Box, makeStyles } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../constants/messages';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { makeCampaignsDropDown } from '../../utils/index';
import { findCountryIds } from '../../utils/LqasIm.tsx';

import { useLqasIm } from '../IM/requests';
import { LqasImMap } from '../../components/LQAS-IM/LqasImMap';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';
import { CaregiversTable } from '../../components/LQAS-IM/CaregiversTable.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImPercentageChart } from '../../components/LQAS-IM/LqasImPercentageChart.tsx';
import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { LqasSummary } from '../../components/LQAS-IM/LqasSummary.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';

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
    const { data: LQASData, isLoading } = useLqasIm('lqas');

    const countryIds = findCountryIds(LQASData).toString();

    const { data: campaigns = [], isLoading: campaignsLoading } =
        useGetCampaigns({
            countries: countryIds,
            enabled: Boolean(countryIds),
        }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const dropDownOptions = useMemo(
        () => makeCampaignsDropDown(campaigns),
        [campaigns],
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
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        <Box ml={2}>
                            <LqasImMapHeader round="round_1" />
                            <LqasSummary round="round_1" campaign={campaign} />
                            <LqasImMap
                                round="round_1"
                                selectedCampaign={campaign}
                                type="lqas"
                                countryId={countryOfSelectedCampaign}
                                campaigns={campaigns}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2}>
                            <LqasImMapHeader round="round_2" />
                            <LqasSummary round="round_2" campaign={campaign} />
                            <LqasImMap
                                round="round_2"
                                selectedCampaign={campaign}
                                type="lqas"
                                countryId={countryOfSelectedCampaign}
                                campaigns={campaigns}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    {campaign && (
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <GraphTitle
                                    text={formatMessage(MESSAGES.lqasPerRegion)}
                                    displayTrigger={campaign}
                                />
                            </Box>
                        </Grid>
                    )}
                    <Grid item xs={6}>
                        <Box ml={2} mt={2}>
                            <LqasImPercentageChart
                                type="lqas"
                                round="round_1"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} mr={2}>
                        <Box mr={2} mt={2}>
                            <LqasImPercentageChart
                                type="lqas"
                                round="round_2"
                                campaign={campaign}
                                countryId={countryOfSelectedCampaign}
                            />
                        </Box>
                    </Grid>
                </Grid>
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
                    <Grid item xs={6}>
                        <Box ml={2} mt={2}>
                            <NoFingerMark
                                data={LQASData.stats}
                                campaign={campaign}
                                round="round_1"
                                type="LQAS"
                                chartKey="nfmRound1"
                                isLoading={isLoading}
                                showChart={Boolean(campaign)}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box mr={2} mt={2}>
                            <NoFingerMark
                                data={LQASData.stats}
                                campaign={campaign}
                                round="round_2"
                                type="LQAS"
                                chartKey="nfmRound2"
                                isLoading={isLoading}
                                showChart={Boolean(campaign)}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} direction="row">
                    <Grid item xs={6}>
                        <Box ml={2} mt={2}>
                            <CaregiversTable
                                campaign={campaign}
                                round="round_1"
                                chartKey="CGTable1"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box mr={2} mt={2}>
                            <CaregiversTable
                                campaign={campaign}
                                round="round_2"
                                chartKey="CGTable2"
                            />
                        </Box>
                    </Grid>
                </Grid>
                <DisplayIfUserHasPerm permission="iaso_polio_config">
                    <Grid container item>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <DistrictsNotFound
                                    data={LQASData.stats}
                                    campaign={campaign}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box ml={2} mb={4}>
                                <DatesIgnored
                                    campaign={campaign}
                                    data={LQASData}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DisplayIfUserHasPerm>
            </Grid>
        </>
    );
};
