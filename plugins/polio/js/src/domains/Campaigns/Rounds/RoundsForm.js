import React, { useState, useEffect } from 'react';
import isEqual from 'lodash/isEqual';
import { useSafeIntl } from 'bluesquare-components';
import { Tabs, Tab, Box, Button, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Clear';
import { useFormikContext } from 'formik';

import MESSAGES from '../../../constants/messages';
import { RoundForm } from './RoundForm.tsx';
import { useStyles } from '../../../styles/theme';

const maxRoundsCount = 6;

export const roundFormFields = rounds => {
    const roundKeys = [
        ...rounds
            .map((_round, i) => {
                return [
                    `rounds[${i}].awareness_of_campaign_planning`,
                    `rounds[${i}].im_percentage_children_missed_in_plus_out_household`,
                    `rounds[${i}].im_percentage_children_missed_out_household`,
                    `rounds[${i}].im_percentage_children_missed_in_household`,
                    `rounds[${i}].main_awareness_problem`,
                    `rounds[${i}].lqas_district_failing`,
                    `rounds[${i}].lqas_district_passing`,
                    `rounds[${i}].lqas_ended_at`,
                    `rounds[${i}].lqas_started_at`,
                    `rounds[${i}].im_ended_at`,
                    `rounds[${i}].im_started_at`,
                    `rounds[${i}].mop_up_ended_at`,
                    `rounds[${i}].mop_up_started_at`,
                    `rounds[${i}].ended_at`,
                    `rounds[${i}].started_at`,
                    `rounds[${i}].percentage_covered_target_population`,
                ];
            })
            .flat(),
    ];
    return roundKeys;
};

export const RoundsForm = () => {
    const classes = useStyles();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext();
    const { formatMessage } = useSafeIntl();
    const [lastRound, setLastRound] = useState(rounds[rounds.length - 1]);

    const newRoundNumber = lastRound?.number + 1 || 1;

    const displayAddZeroRound =
        rounds.length === 0 ||
        (rounds.length > 0 &&
            rounds[0].number === 1 &&
            rounds.filter(rnd => rnd.number === 0).length === 0);

    const [currentRoundNumber, setCurrentRoundNumber] = useState(
        rounds.length > 0 ? rounds[0].number : undefined,
    );

    const handleAddRound = roundIndex => {
        const newRounds = [...rounds];
        newRounds.splice(roundIndex === 0 ? 0 : roundIndex - 1, 0, {
            number: roundIndex,
            started_at: null,
            ended_at: null,
        });
        const sortedRounds = newRounds.sort((a, b) => a.number - b.number);
        setFieldValue('rounds', sortedRounds);
        setLastRound(newRounds[sortedRounds.length - 1]);
        setCurrentRoundNumber(roundIndex);
    };

    const handleDeleteRound = roundIndex => {
        const newRounds = [...rounds];
        let newCurrentRoundNumber = roundIndex;
        if (roundIndex === 0) {
            newRounds.shift();
            newCurrentRoundNumber = 1;
        } else {
            newRounds.pop();
            newCurrentRoundNumber -= 1;
        }
        setFieldValue('rounds', newRounds);
        setLastRound(newRounds[newRounds.length - 1]);
        setCurrentRoundNumber(newCurrentRoundNumber);
    };

    const handleChange = (_, newValue) => {
        setCurrentRoundNumber(newValue);
    };

    useEffect(() => {
        if (rounds.length > 0) {
            const newRounds = [...rounds].sort((a, b) => a.number - b.number);
            if (!isEqual(newRounds, rounds)) {
                setLastRound(newRounds[newRounds.length - 1]);
            }
        }
    }, [rounds]);

    return (
        <>
            <Box mt={rounds.length > 0 ? -4 : 0} display="flex">
                {displayAddZeroRound && (
                    <Box mr={rounds.length === 0 ? 2 : 0} mt={2}>
                        <Button
                            className={
                                rounds.length > 0 ? classes.addRoundButton : ''
                            }
                            size="small"
                            color="secondary"
                            onClick={() => handleAddRound(0)}
                            startIcon={<AddIcon fontSize="small" />}
                            variant="outlined"
                        >
                            {formatMessage(MESSAGES.round)} 0
                        </Button>
                    </Box>
                )}

                <Box className={classes.tabsContainer} display="flex">
                    {rounds.length > 1 && (
                        <ul className={classes.removeContainer}>
                            {rounds.map(round => (
                                <li
                                    className={classes.removeContainerItem}
                                    key={round.number}
                                >
                                    {(round.number === 0 ||
                                        round.number === lastRound?.number) && (
                                        <Tooltip
                                            size="small"
                                            title={
                                                <>
                                                    {formatMessage(
                                                        MESSAGES.deleteRound,
                                                    )}{' '}
                                                    {round.number}
                                                </>
                                            }
                                        >
                                            <IconButton
                                                onClick={() =>
                                                    handleDeleteRound(
                                                        round.number,
                                                    )
                                                }
                                                className={
                                                    classes.removeIconButton
                                                }
                                                size="small"
                                            >
                                                <RemoveIcon color="primary" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {rounds.length > 0 && (
                        <Tabs
                            value={currentRoundNumber}
                            className={classes.subTabs}
                            textColor="primary"
                            onChange={handleChange}
                        >
                            {rounds.map(round => (
                                <Tab
                                    key={round.number}
                                    className={classes.subTab}
                                    label={
                                        <span>
                                            {formatMessage(MESSAGES.round)}{' '}
                                            {round.number}
                                        </span>
                                    }
                                    value={round.number}
                                />
                            ))}
                        </Tabs>
                    )}
                </Box>
                {(!lastRound || lastRound?.number < maxRoundsCount) && (
                    <Box mt={2}>
                        <Button
                            className={
                                rounds.length > 0 ? classes.addRoundButton : ''
                            }
                            size="small"
                            color="secondary"
                            onClick={() => handleAddRound(newRoundNumber)}
                            startIcon={<AddIcon fontSize="small" />}
                            variant="outlined"
                        >
                            {formatMessage(MESSAGES.round)} {newRoundNumber}
                        </Button>
                    </Box>
                )}
            </Box>
            {currentRoundNumber !== undefined && (
                <Box mt={2}>
                    <RoundForm roundNumber={currentRoundNumber} />
                </Box>
            )}
        </>
    );
};
