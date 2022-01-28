import React from 'react';
import PropTypes from 'prop-types';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl } from 'bluesquare-components';

import { Grid, Box, makeStyles } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../constants/messages';

import { useGetCampaigns } from '../../hooks/useGetCampaigns';

import { useLqasIm, useScopeAndDistrictsNotFound } from '../IM/requests';

import { LqasImMap } from '../../components/LQAS-IM/LqasImMap';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';
import { Filters } from '../../components/LQAS-IM/Filters.tsx';
import { CaregiversTable } from '../../components/LQAS-IM/CaregiversTable.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImPercentageChart } from '../../components/LQAS-IM/LqasImPercentageChart.tsx';
import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { LqasSummary } from '../../components/LQAS-IM/LqasSummary.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { HorizontalDivider } from '../../components/HorizontalDivider.tsx';

const styles = theme => ({
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
    // TODO use styling from commonStyles. overflow-x issue needs to be delat with though
    container: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: `calc(100vh - 65px)`,
        maxWidth: '100vw',
    },
    divider: { width: '100%' },
});

const useStyles = makeStyles(styles);

export const Lqas = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { campaign, country } = router.params;
    const {
        data: LQASData,
        isFetching,
        isLoading,
    } = useLqasIm('lqas', country);

    const { data: campaigns = [] } = useGetCampaigns({
        countries: [country],
        enabled: Boolean(country),
    }).query;
    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const { data: scopeStatus } = useScopeAndDistrictsNotFound(
        'lqas',
        campaign,
    );
    const hasScope = scopeStatus[campaign]?.hasScope;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container className={classes.container}>
                    <Filters isFetching={isFetching} />
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={6}>
                            <Box ml={2}>
                                <LqasImMapHeader round="round_1" />
                                <LqasSummary
                                    round="round_1"
                                    campaign={campaign}
                                    country={country}
                                />
                                <LqasImMap
                                    round="round_1"
                                    selectedCampaign={campaign}
                                    type="lqas"
                                    countryId={countryOfSelectedCampaign}
                                    campaigns={campaigns}
                                />
                            </Box>
                        </Grid>
                        {/* <Grid item>
                        <Divider orientation="vertical" flexItem />
                    </Grid> */}
                        <Grid item xs={6} mr={2}>
                            <Box mr={2}>
                                <LqasImMapHeader round="round_2" />
                                <LqasSummary
                                    round="round_2"
                                    campaign={campaign}
                                    country={country}
                                />
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
                    <HorizontalDivider mt={4} displayTrigger={campaign} />
                    <Grid container item spacing={2} direction="row">
                        {campaign && (
                            <Grid item xs={12}>
                                <Box ml={2} mt={2}>
                                    <GraphTitle
                                        text={formatMessage(
                                            MESSAGES.lqasPerRegion,
                                        )}
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
                    <HorizontalDivider displayTrigger={campaign && hasScope} />
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsNoFingerMarked,
                                    )}
                                    displayTrigger={campaign && hasScope}
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
                    <HorizontalDivider displayTrigger={campaign} />
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={12}>
                            <Box ml={2} mt={2}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.caregivers_informed,
                                    )}
                                    displayTrigger={campaign}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box ml={2} mt={2}>
                                <CaregiversTable
                                    campaign={campaign}
                                    round="round_1"
                                    chartKey="CGTable1"
                                    country={country}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box mr={2} mt={2}>
                                <CaregiversTable
                                    campaign={campaign}
                                    round="round_2"
                                    chartKey="CGTable2"
                                    country={country}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <DisplayIfUserHasPerm permission="iaso_polio_config">
                        <HorizontalDivider displayTrigger={campaign} />
                        <Grid container item>
                            <Grid item xs={4}>
                                <Box ml={2} mb={4} mt={2}>
                                    <DistrictsNotFound
                                        data={LQASData.stats}
                                        campaign={campaign}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box ml={2} mb={4} mt={2}>
                                    <DatesIgnored
                                        campaign={campaign}
                                        data={LQASData}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </DisplayIfUserHasPerm>
                </Grid>
            </Box>
        </>
    );
};

Lqas.propTypes = {
    router: PropTypes.object.isRequired,
};
