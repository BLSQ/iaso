import React from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl } from 'bluesquare-components';

import { Grid, Box, makeStyles } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { oneOf, PropTypes } from 'prop-types';
import MESSAGES from '../../constants/messages';

import { useGetCampaigns } from '../../hooks/useGetCampaigns';

import { useLqasIm, useScopeAndDistrictsNotFound } from './requests';

import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { LqasImMap } from '../../components/LQAS-IM/LqasImMap';
import { NoFingerMark } from '../../components/LQAS-IM/NoFingerMark.tsx';
import { Filters } from '../../components/LQAS-IM/Filters.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImPercentageChart } from '../../components/LQAS-IM/LqasImPercentageChart.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { ImSummary } from '../../components/LQAS-IM/ImSummary.tsx';
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
});

const useStyles = makeStyles(styles);

export const ImStats = ({ imType, router }) => {
    const { campaign, country } = router.params;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: imData, isFetching } = useLqasIm(imType, country);

    const { data: campaigns = [] } = useGetCampaigns({
        countries: [country],
        enabled: Boolean(country),
    }).query;

    const countryOfSelectedCampaign = campaigns.filter(
        campaignOption => campaignOption.obr_name === campaign,
    )[0]?.top_level_org_unit_id;

    const { data: scopeStatus } = useScopeAndDistrictsNotFound(
        imType,
        campaign,
    );
    const hasScope = scopeStatus[campaign]?.hasScope;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container className={classes.container}>
                    <Filters isFetching={isFetching} />
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={6}>
                            <Box ml={2}>
                                <LqasImMapHeader round="round_1" />
                                <ImSummary
                                    round="round_1"
                                    campaign={campaign}
                                    type={imType}
                                    country={country}
                                />
                                <LqasImMap
                                    round="round_1"
                                    selectedCampaign={campaign}
                                    type={imType}
                                    countryId={countryOfSelectedCampaign}
                                    campaigns={campaigns}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box mr={2}>
                                <LqasImMapHeader round="round_2" />
                                <ImSummary
                                    round="round_2"
                                    campaign={campaign}
                                    type={imType}
                                    country={country}
                                />
                                <LqasImMap
                                    round="round_2"
                                    selectedCampaign={campaign}
                                    type={imType}
                                    countryId={countryOfSelectedCampaign}
                                    campaigns={campaigns}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <HorizontalDivider mt={4} displayTrigger={campaign} />
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
                                <LqasImPercentageChart
                                    type={imType}
                                    round="round_1"
                                    campaign={campaign}
                                    countryId={countryOfSelectedCampaign}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box mr={2} mt={2}>
                                <LqasImPercentageChart
                                    type={imType}
                                    round="round_2"
                                    campaign={campaign}
                                    countryId={countryOfSelectedCampaign}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    {imType === 'imIHH' && (
                        <>
                            <HorizontalDivider
                                displayTrigger={campaign && hasScope}
                                mb={2}
                                mt={2}
                            />
                            <Grid container item spacing={2} direction="row">
                                <Grid item xs={12}>
                                    <Box ml={2} mt={2}>
                                        <GraphTitle
                                            text={formatMessage(
                                                MESSAGES.reasonsNoFingerMarked,
                                            )}
                                            displayTrigger={
                                                campaign && hasScope
                                            }
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6} mr={2}>
                                    <Box ml={2} mt={2}>
                                        <NoFingerMark
                                            data={imData.stats}
                                            campaign={campaign}
                                            round="round_1"
                                            type="IM"
                                            chartKey="nfmRound1"
                                            isLoading={isFetching}
                                            showChart={Boolean(campaign)}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6} mr={2}>
                                    <Box mr={2} mt={2}>
                                        <NoFingerMark
                                            data={imData.stats}
                                            campaign={campaign}
                                            round="round_2"
                                            type="IM"
                                            chartKey="nfmRound2"
                                            isLoading={isFetching}
                                            showChart={Boolean(campaign)}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </>
                    )}
                    <DisplayIfUserHasPerm permission="iaso_polio_config">
                        <HorizontalDivider
                            displayTrigger={campaign}
                            mb={2}
                            mt={2}
                        />
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
                                    <DatesIgnored
                                        campaign={campaign}
                                        data={imData}
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
ImStats.defaultProps = {
    imType: 'imGlobal',
};

ImStats.propTypes = {
    imType: oneOf(['imGlobal', 'imIHH', 'imOHH']),
    router: PropTypes.object.isRequired,
};
