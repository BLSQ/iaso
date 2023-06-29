/* eslint-disable react/no-array-index-key */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
    useSafeIntl,
    commonStyles,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { Grid, Box, makeStyles, Paper } from '@material-ui/core';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useDispatch } from 'react-redux';
import { push } from 'react-router-redux';
import { Filters } from '../../components/LQAS-IM/Filters.tsx';
import { CaregiversTable } from '../../components/LQAS-IM/CaregiversTable.tsx';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../../components/LQAS-IM/LqasImHorizontalChart.tsx';
import { DistrictsNotFound } from '../../components/LQAS-IM/DistrictsNotFound.tsx';
import { DatesIgnored } from '../../components/LQAS-IM/DatesIgnored.tsx';
import { HorizontalDivider } from '../../components/HorizontalDivider.tsx';
import { LqasImVerticalChart } from '../../components/LQAS-IM/LqasImVerticalChart.tsx';
import { MapContainer } from '../../components/LQAS-IM/MapContainer.tsx';
import { useLqasData } from '../../hooks/useLqasData.ts';
import MESSAGES from '../../constants/messages';
import { BadRoundNumbers } from '../../components/LQAS-IM/BadRoundNumber.tsx';
import { makeDropdownOptions } from '../../utils/LqasIm.tsx';
import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { commaSeparatedIdsToArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { defaultRounds } from '../IM/constants.ts';

const paperElevation = 2;

const styles = theme => ({
    ...commonStyles(theme),
    filter: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) },
});

const useStyles = makeStyles(styles);

export const Lqas = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const dispatch = useDispatch();
    const { campaign, country, rounds } = router.params;
    const [selectedRounds, setSelectedRounds] = useState(
        rounds ? commaSeparatedIdsToArray(rounds) : defaultRounds,
    );

    const {
        LQASData,
        isFetching,
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    } = useLqasData(campaign, country, selectedRounds);

    const dropDownOptions = useMemo(() => {
        return makeDropdownOptions(LQASData.stats, campaign, selectedRounds);
    }, [LQASData, campaign, selectedRounds]);

    const onRoundChange = useCallback(
        index => value => {
            const updatedSelection = [...selectedRounds];
            updatedSelection[index] = value;
            setSelectedRounds(updatedSelection);
            const url = genUrl(router, {
                rounds: updatedSelection,
            });
            dispatch(push(url));
        },
        [dispatch, router, selectedRounds],
    );

    const divider = (
        <HorizontalDivider mt={6} mb={4} ml={-4} mr={-4} displayTrigger />
    );
    useSkipEffectOnMount(() => {
        setSelectedRounds(defaultRounds);
    }, [campaign, country]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    isFetching={isFetching}
                    campaigns={campaigns}
                    campaignsFetching={campaignsFetching}
                />
                <Grid container spacing={2} direction="row">
                    {selectedRounds.map((rnd, index) => (
                        <Grid item xs={6} key={`round_${rnd}_${index}`}>
                            <MapContainer
                                round={parseInt(rnd, 10)} // parsing the rnd because it willl be a string when coming from params
                                campaign={campaign}
                                campaigns={campaigns}
                                country={country}
                                data={convertedData}
                                isFetching={isFetching}
                                debugData={debugData}
                                paperElevation={paperElevation}
                                type="lqas"
                                onRoundChange={onRoundChange(index)}
                                options={dropDownOptions}
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
                                    text={formatMessage(MESSAGES.lqasPerRegion)}
                                    displayTrigger
                                />
                            </Grid>
                            {selectedRounds.map((rnd, index) => (
                                <Grid
                                    item
                                    xs={6}
                                    key={`horiz-chart-${rnd}_${index}`}
                                >
                                    <Paper elevation={paperElevation}>
                                        <LqasImHorizontalChart
                                            type="lqas"
                                            round={parseInt(rnd, 10)}
                                            campaign={campaign}
                                            countryId={parseInt(country, 10)}
                                            data={convertedData}
                                            isLoading={isFetching}
                                        />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        {divider}
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.reasonsNoFingerMarked,
                                    )}
                                    displayTrigger={hasScope}
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
                                                showChart={Boolean(campaign)}
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
                                    displayTrigger={hasScope}
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
                                                showChart={Boolean(campaign)}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        {divider}
                        <Grid container spacing={2} direction="row">
                            <Grid item xs={12}>
                                <GraphTitle
                                    text={formatMessage(
                                        MESSAGES.caregivers_informed,
                                    )}
                                    displayTrigger
                                />
                            </Grid>
                            {chartData.cg.map(c => (
                                <Grid item xs={6} key={c.chartKey}>
                                    <CaregiversTable
                                        marginTop={false}
                                        campaign={campaign}
                                        round={c.round}
                                        chartKey={c.chartKey}
                                        data={convertedData}
                                        paperElevation={paperElevation}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm permission="iaso_polio_config">
                                <HorizontalDivider
                                    mt={2}
                                    mb={4}
                                    ml={-4}
                                    mr={-4}
                                    displayTrigger
                                />
                                <Grid container item spacing={2}>
                                    <Grid item xs={4}>
                                        <DistrictsNotFound
                                            data={LQASData.stats}
                                            campaign={campaign}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <DatesIgnored
                                            campaign={campaign}
                                            data={LQASData}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <BadRoundNumbers
                                            formsWithBadRoundNumber={
                                                LQASData?.stats[campaign]
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

Lqas.propTypes = {
    router: PropTypes.object.isRequired,
};
