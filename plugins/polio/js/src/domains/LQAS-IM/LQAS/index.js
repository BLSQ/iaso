/* eslint-disable react/no-array-index-key */
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    useSafeIntl,
    commonStyles,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { Grid, Box, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useDispatch } from 'react-redux';
import { push } from 'react-router-redux';
import { Filters } from '../shared/Filters.tsx';
import { CaregiversTable } from '../shared/CaregiversTable.tsx';
import { GraphTitle } from '../shared/GraphTitle.tsx';
import { LqasImHorizontalChart } from '../shared/LqasImHorizontalChart.tsx';
import { DistrictsNotFound } from '../shared/DistrictsNotFound.tsx';
import { DatesIgnored } from '../shared/DatesIgnored.tsx';
import { HorizontalDivider } from '../../../components/HorizontalDivider.tsx';
import { LqasImVerticalChart } from '../shared/LqasImVerticalChart.tsx';
import { useLqasData } from './hooks/useLqasData.ts';
import { LqasOverviewContainer } from './CountryOverview/LqasOverviewContainer.tsx';
import MESSAGES from '../../../constants/messages';
import { BadRoundNumbers } from '../shared/BadRoundNumber.tsx';
import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing.ts';
import { commaSeparatedIdsToArray } from '../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { LIST, paperElevation } from '../shared/constants.ts';
import { useLqasIm } from '../shared/requests.ts';
import { Sides } from '../../../constants/types.ts';

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
    // TODO initialize undefined to be able to make boolean check on it
    const [selectedRounds, setSelectedRounds] = useState(
        rounds ? commaSeparatedIdsToArray(rounds) : [undefined, undefined],
    );
    const { data: LQASData, isFetching } = useLqasIm('lqas', country);

    const {
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    } = useLqasData({ campaign, country, selectedRounds, LQASData });

    const dropDownOptions = useMemo(() => {
        return campaigns
            ?.filter(c => c.obr_name === campaign)[0]
            ?.rounds.sort((a, b) => a.number - b.number)
            .map(r => {
                return {
                    label: `Round ${r.number}`,
                    value: r.number,
                };
            });
    }, [campaign, campaigns]);

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
        setSelectedRounds([undefined, undefined]);
    }, [country]);

    useEffect(() => {
        if (dropDownOptions && !rounds) {
            if (dropDownOptions.length === 1) {
                setSelectedRounds([
                    dropDownOptions[0].value,
                    dropDownOptions[0].value,
                ]);
                const url = genUrl(router, {
                    rounds: [
                        dropDownOptions[0].value,
                        dropDownOptions[0].value,
                    ],
                    rightTab: LIST,
                });
                dispatch(push(url));
            }
            if (dropDownOptions.length > 1) {
                setSelectedRounds([
                    dropDownOptions[0].value,
                    dropDownOptions[1].value,
                ]);
            }
        }
    }, [dropDownOptions, campaign, rounds, router, dispatch]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box mb={1}>
                    <Filters
                        isFetching={isFetching}
                        campaigns={campaigns}
                        campaignsFetching={campaignsFetching}
                        category="lqas"
                    />
                </Box>
                <Grid container spacing={2} direction="row">
                    {/* {selectedRounds.map((rnd, index) => ( */}
                    <Grid item xs={6} key={`round_${selectedRounds[0]}_${0}`}>
                        <LqasOverviewContainer
                            round={parseInt(selectedRounds[0], 10)} // parsing the rnd because it will be a string when coming from params
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            onRoundChange={onRoundChange(0)}
                            options={dropDownOptions}
                            side={Sides.left}
                            router={router}
                        />
                    </Grid>
                    <Grid item xs={6} key={`round_${selectedRounds[1]}_${1}`}>
                        <LqasOverviewContainer
                            round={parseInt(selectedRounds[1], 10)} // parsing the rnd because it will be a string when coming from params
                            campaign={campaign}
                            campaigns={campaigns}
                            country={country}
                            data={convertedData}
                            isFetching={isFetching || campaignsFetching}
                            debugData={debugData}
                            paperElevation={paperElevation}
                            onRoundChange={onRoundChange(1)}
                            options={dropDownOptions}
                            side={Sides.right}
                            router={router}
                        />
                    </Grid>
                    {/* ))} */}
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
