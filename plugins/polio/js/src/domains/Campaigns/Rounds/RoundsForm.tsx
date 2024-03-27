import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Clear';
import { Box, Button, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFormikContext } from 'formik';
import isEqual from 'lodash/isEqual';
import React, { FunctionComponent, useEffect, useState } from 'react';

import MESSAGES from '../../../constants/messages';
import { Campaign, Round } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';
import { ScopeForm } from '../Scope/ScopeForm';
import { RoundForm } from './RoundForm';

const maxRoundsCount = 6;

export const roundFormFields = (rounds: Round[]): string[] => {
    const roundKeys = [
        ...rounds
            .map((_round, i) => {
                return [
                    `rounds[${i}].mop_up_ended_at`,
                    `rounds[${i}].mop_up_started_at`,
                    `rounds[${i}].ended_at`,
                    `rounds[${i}].started_at`,
                    `rounds[${i}].percentage_covered_target_population`,
                    `rounds[${i}].target_population`,
                ];
            })
            .flat(),
    ];
    return roundKeys;
};

export const RoundsForm: FunctionComponent = () => {
    const classes = useStyles();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext<Campaign>();
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
        } as Round);
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
                    <Box mr={rounds.length === 0 ? 2 : 0} mt="14px">
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
                                    sx={theme => ({
                                        fontSize: 12,
                                        minWidth: 0,
                                        padding: '10px 12px',
                                        [theme.breakpoints.up('sm')]: {
                                            minWidth: 0,
                                        },
                                    })}
                                    key={round.number}
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
                    <Box mt="14px" ml={2}>
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
                <>
                    <RoundForm roundNumber={currentRoundNumber} />
                    <ScopeForm currentTab={`${currentRoundNumber}`} />
                </>
            )}
        </>
    );
};
