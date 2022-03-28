import React from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Grid, Box, makeStyles, Paper } from '@material-ui/core';

import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { oneOf, PropTypes } from 'prop-types';

import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { Filters } from '../../components/LQAS-IM/Filters.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../../components/LQAS-IM/LqasImHorizontalChart.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { HorizontalDivider } from '../../components/HorizontalDivider.tsx';
import { LqasImVerticalChart } from '../../components/LQAS-IM/LqasImVerticalChart.tsx';
import { MapContainer } from '../../components/LQAS-IM/MapContainer.tsx';

import { useImData } from '../../hooks/useImData.ts';

import MESSAGES from '../../constants/messages';
import { BadRoundNumbers } from '../../components/LQAS-IM/BadRoundNumber';

const rounds = ['round_1', 'round_2'];
const paperElevation = 2;

const styles = theme => ({
    ...commonStyles(theme),
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
});

const useStyles = makeStyles(styles);

export const ImStats = ({ imType, router }) => {
    const { campaign, country } = router.params;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const {
        imData,
        isFetching,
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    } = useImData(campaign, country, imType);

    const divider = (
        <HorizontalDivider mt={6} mb={4} ml={-4} mr={-4} displayTrigger />
    );
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES[imType])}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    isFetching={isFetching}
                    campaigns={campaigns}
                    campaignsFetching={campaignsFetching}
                />
                <Grid container spacing={2} direction="row">
                    {rounds.map(r => (
                        <Grid item xs={6} key={r}>
                            <MapContainer
                                round={r}
                                campaign={campaign}
                                campaigns={campaigns}
                                country={country}
                                data={convertedData}
                                isFetching={isFetching}
                                debugData={debugData}
                                paperElevation={paperElevation}
                                type={imType}
                            />
                        </Grid>
                    ))}
                </Grid>
                {campaign && !isFetching && (
                    <>
                        {divider}
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(MESSAGES.imPerRegion)}
                                    displayTrigger={campaign}
                                />
                            </Grid>
                            {rounds.map(r => (
                                <Grid item xs={6} key={r}>
                                    <Paper elevation={paperElevation}>
                                        <LqasImHorizontalChart
                                            type={imType}
                                            round={r}
                                            campaign={campaign}
                                            countryId={parseInt(country, 10)}
                                            data={convertedData}
                                            isLoading={isFetching}
                                        />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        {imType === 'imIHH' && (
                            <>
                                {divider}
                                <Grid container spacing={2} direction="row">
                                    <Grid item xs={12}>
                                        <GraphTitle
                                            text={formatMessage(
                                                MESSAGES.reasonsNoFingerMarked,
                                            )}
                                            displayTrigger={
                                                campaign && hasScope
                                            }
                                        />
                                    </Grid>
                                    {chartData.nfm.map(d => (
                                        <Grid item xs={6} key={d.chartKey}>
                                            <Paper elevation={paperElevation}>
                                                <Box p={2}>
                                                    <LqasImVerticalChart
                                                        data={d.data}
                                                        chartKey={d.chartKey}
                                                        title={d.title}
                                                        isLoading={isFetching}
                                                        showChart={Boolean(
                                                            campaign,
                                                        )}
                                                    />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                                <HorizontalDivider
                                    mt={6}
                                    mb={4}
                                    ml={0}
                                    mr={0}
                                    displayTrigger
                                />
                                <Grid container spacing={2} direction="row">
                                    <Grid item xs={12}>
                                        <GraphTitle
                                            text={formatMessage(
                                                MESSAGES.reasonsForAbsence,
                                            )}
                                            displayTrigger={
                                                campaign && hasScope
                                            }
                                        />
                                    </Grid>
                                    {chartData.rfa.map(d => (
                                        <Grid item xs={6} key={d.chartKey}>
                                            <Paper elevation={paperElevation}>
                                                <Box p={2}>
                                                    <LqasImVerticalChart
                                                        data={d.data}
                                                        chartKey={d.chartKey}
                                                        title={d.title}
                                                        isLoading={isFetching}
                                                        showChart={Boolean(
                                                            campaign,
                                                        )}
                                                    />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </>
                        )}
                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm permission="iaso_polio_config">
                                <HorizontalDivider
                                    mt={6}
                                    mb={4}
                                    ml={-4}
                                    mr={-4}
                                    displayTrigger
                                />
                                <Grid container item>
                                    <Grid item xs={4}>
                                        <DistrictsNotFound
                                            campaign={campaign}
                                            data={imData.stats}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <DatesIgnored
                                            campaign={campaign}
                                            data={imData}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <BadRoundNumbers
                                            formsWithBadRoundNumber={
                                                imData?.stats[campaign]
                                                    ?.bad_round_number ?? 0
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </DisplayIfUserHasPerm>
                        )}
                    </>
                )}
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
