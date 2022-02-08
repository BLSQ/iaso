import React from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl } from 'bluesquare-components';

import { Grid, Box, makeStyles } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { oneOf, PropTypes } from 'prop-types';
import MESSAGES from '../../constants/messages';

import { useGetCampaigns } from '../../hooks/useGetCampaigns';

import { useLqasIm } from './requests';
import { useDebugData } from '../../hooks/useDebugData.ts';
import { formatForRfaChart, formatForNfmChart } from '../../utils/LqasIm.tsx';
import { useRfaTitle } from '../../hooks/useRfaTitle.ts';
import { useNfmTitle } from '../../hooks/useNfmTitle.ts';

import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { LqasImMap } from '../../components/LQAS-IM/LqasImMap';
import { Filters } from '../../components/LQAS-IM/Filters.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../../components/LQAS-IM/LqasImHorizontalChart.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { ImSummary } from '../../components/LQAS-IM/ImSummary.tsx';
import { HorizontalDivider } from '../../components/HorizontalDivider.tsx';
import { useConvertedLqasImData } from '../../hooks/useConvertedLqasImData.ts';
import { LqasImVerticalChart } from '../../components/LQAS-IM/LqasImVerticalChart.tsx';
import { useVerticalChartData } from '../../hooks/useVerticalChartData.ts';

const styles = theme => ({
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
    // TODO use styling from commonStyles. overflow-x issue needs to be dealt with though
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
    const convertedData = useConvertedLqasImData(imData);
    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        }).query;

    const debugData = useDebugData(imData, campaign);
    const hasScope = debugData[campaign]?.hasScope;

    const [nfmRound1, nfmRound2] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForNfmChart,
        type: 'im',
    });
    const [nfmTitle1, nfmTitle2] = useNfmTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
    });

    const [rfaRound1, rfaRound2] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForRfaChart,
    });

    const [rfaTitle1, rfaTitle2] = useRfaTitle({
        data: imData?.stats,
        campaign,
    });

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container className={classes.container}>
                    <Filters
                        isFetching={isFetching}
                        campaigns={campaigns}
                        campaignsFetching={campaignsFetching}
                    />
                    <Grid container item spacing={2} direction="row">
                        <Grid item xs={6}>
                            <Box ml={2}>
                                <LqasImMapHeader round="round_1" />
                                <ImSummary
                                    round="round_1"
                                    campaign={campaign}
                                    type={imType}
                                    data={convertedData}
                                />
                                <LqasImMap
                                    round="round_1"
                                    selectedCampaign={campaign}
                                    type={imType}
                                    countryId={parseInt(country, 10)}
                                    campaigns={campaigns}
                                    data={convertedData}
                                    isFetching={isFetching}
                                    disclaimerData={debugData}
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
                                    data={convertedData}
                                />
                                <LqasImMap
                                    round="round_2"
                                    selectedCampaign={campaign}
                                    type={imType}
                                    countryId={parseInt(country, 10)}
                                    campaigns={campaigns}
                                    data={convertedData}
                                    isFetching={isFetching}
                                    disclaimerData={debugData}
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
                                <LqasImHorizontalChart
                                    type={imType}
                                    round="round_1"
                                    campaign={campaign}
                                    countryId={parseInt(country, 10)}
                                    data={convertedData}
                                    isLoading={isFetching}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} mr={2}>
                            <Box mr={2} mt={2}>
                                <LqasImHorizontalChart
                                    type={imType}
                                    round="round_2"
                                    campaign={campaign}
                                    countryId={parseInt(country, 10)}
                                    data={convertedData}
                                    isLoading={isFetching}
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
                                <Grid item xs={6}>
                                    <Box ml={2} mt={2}>
                                        <LqasImVerticalChart
                                            data={nfmRound1}
                                            chartKey="nfmRound1"
                                            title={nfmTitle1}
                                            isLoading={isFetching}
                                            showChart={Boolean(campaign)}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box mr={2} mt={2}>
                                        <LqasImVerticalChart
                                            data={nfmRound2}
                                            chartKey="nfmRound2"
                                            title={nfmTitle2}
                                            isLoading={isFetching}
                                            showChart={Boolean(campaign)}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid container item spacing={2} direction="row">
                                <Grid item xs={12}>
                                    <Box ml={2} mt={2}>
                                        <GraphTitle
                                            text={formatMessage(
                                                MESSAGES.reasonsForAbsence,
                                            )}
                                            displayTrigger={
                                                campaign && hasScope
                                            }
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box ml={2} mt={2}>
                                        <LqasImVerticalChart
                                            data={rfaRound1}
                                            title={rfaTitle1}
                                            chartKey="rfaRound1"
                                            isLoading={isFetching}
                                            showChart={Boolean(campaign)}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box mr={2} mt={2}>
                                        <LqasImVerticalChart
                                            data={rfaRound2}
                                            title={rfaTitle2}
                                            chartKey="rfaRound2"
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
