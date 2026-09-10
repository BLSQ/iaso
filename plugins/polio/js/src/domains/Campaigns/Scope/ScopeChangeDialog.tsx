import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

import MESSAGES from '../../../constants/messages';
import { Scope } from '../../../constants/types';
import { formatRoundDateRange } from '../../../utils/round';
import {
    countDistricts,
    countMergedDistricts,
    type ScopeChangeDirection,
} from './scopeChangeUtils';

export type { ScopeChangeDirection };
export type ScopeChangeMode = 'allRounds' | 'selectedRounds' | 'empty';

export type ScopeChangeRound = {
    number: number;
    started_at?: string | null;
    ended_at?: string | null;
    scopes?: Scope[];
};

export type ScopeChangeResult = {
    mode: ScopeChangeMode;
    selectedRoundNumbers: number[];
};

type Props = {
    open: boolean;
    direction: ScopeChangeDirection;
    rounds: ScopeChangeRound[];
    districtCount?: number;
    onClose?: () => void;
    onConfirm?: (result: ScopeChangeResult) => void;
};

const DIALOG_COPY = {
    toRounds: {
        title: MESSAGES.scope_per_round,
        description: MESSAGES.scopeChangeDescription,
        all: MESSAGES.scopeChangeCopyAllRounds,
        selected: MESSAGES.scopeChangeCopySelectedRounds,
        empty: MESSAGES.scopeChangeEmptyRounds,
        helper: MESSAGES.scopeChangeUncheckedRoundsEmpty,
    },
    toCampaign: {
        title: MESSAGES.scopeChangeToCampaignTitle,
        description: MESSAGES.scopeChangeToCampaignDescription,
        all: MESSAGES.scopeChangeMergeAllRounds,
        selected: MESSAGES.scopeChangeMergeSelectedRounds,
        empty: MESSAGES.scopeChangeEmptyCampaign,
        helper: MESSAGES.scopeChangeUncheckedRoundsDropped,
    },
};

const styles: SxStyles = {
    description: {
        mb: 2,
    },
    radioLabel: {
        mb: 0.5,
    },
    roundsBox: {
        ml: 4,
        mr: 1,
        mb: 1,
        p: 1.5,
        bgcolor: 'grey.100',
        borderRadius: 1,
    },
    roundCheckbox: {
        display: 'block',
        ml: 0,
    },
    roundsHelper: {
        mt: 0.5,
        ml: 0.5,
    },
    warning: {
        mt: 1,
        mb: 1,
    },
    disclaimer: {
        mt: 2,
    },
};

export const ScopeChangeDialog: FunctionComponent<Props> = ({
    open,
    direction,
    rounds,
    districtCount = 0,
    onClose = () => {},
    onConfirm = () => {},
}) => {
    const { formatMessage } = useSafeIntl();
    const copy = DIALOG_COPY[direction];
    const [mode, setMode] = useState<ScopeChangeMode>('allRounds');
    const [selectedRoundNumbers, setSelectedRoundNumbers] = useState<number[]>(
        [],
    );

    const sortedRounds = useMemo(
        () => [...rounds].sort((a, b) => a.number - b.number),
        [rounds],
    );
    const roundNumbers = useMemo(
        () => sortedRounds.map(round => round.number),
        [sortedRounds],
    );
    const allDistrictCount = useMemo(
        () =>
            direction === 'toCampaign'
                ? countMergedDistricts(
                      sortedRounds.map(round => round.scopes ?? []),
                  )
                : districtCount,
        [direction, districtCount, sortedRounds],
    );
    const selectedDistrictCount = useMemo(
        () =>
            direction === 'toCampaign'
                ? countMergedDistricts(
                      sortedRounds
                          .filter(round =>
                              selectedRoundNumbers.includes(round.number),
                          )
                          .map(round => round.scopes ?? []),
                  )
                : districtCount,
        [direction, districtCount, selectedRoundNumbers, sortedRounds],
    );

    useEffect(() => {
        if (open) {
            setMode('allRounds');
            setSelectedRoundNumbers(roundNumbers);
        }
    }, [open, roundNumbers]);

    const handleToggleRound = useCallback((roundNumber: number) => {
        setSelectedRoundNumbers(previous =>
            previous.includes(roundNumber)
                ? previous.filter(number => number !== roundNumber)
                : [...previous, roundNumber],
        );
    }, []);

    const handleApply = useCallback(() => {
        let selected = selectedRoundNumbers;
        if (mode === 'allRounds') {
            selected = roundNumbers;
        } else if (mode === 'empty') {
            selected = [];
        }
        onConfirm({ mode, selectedRoundNumbers: selected });
    }, [mode, onConfirm, roundNumbers, selectedRoundNumbers]);

    const toLabel = formatMessage(MESSAGES.dateRangeTo);
    const dropsDistricts =
        mode === 'empty' ||
        (mode === 'selectedRounds' &&
            selectedRoundNumbers.length < roundNumbers.length);

    const getRoundLabel = (round: ScopeChangeRound): string => {
        if (direction === 'toCampaign') {
            return formatMessage(MESSAGES.scopeChangeRoundDistrictCount, {
                number: `${round.number}`,
                count: `${countDistricts(round.scopes)}`,
            });
        }
        const dateRange = formatRoundDateRange(
            round.started_at,
            round.ended_at,
            toLabel,
        );
        if (dateRange) {
            return formatMessage(MESSAGES.scopeChangeRoundDateRange, {
                number: `${round.number}`,
                dateRange,
            });
        }
        return `${formatMessage(MESSAGES.round)} ${round.number}`;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            data-test="scope-change-dialog"
        >
            <DialogTitle>{formatMessage(copy.title)}</DialogTitle>
            <DialogContent>
                <Typography sx={styles.description}>
                    {formatMessage(copy.description, {
                        count: `${allDistrictCount}`,
                    })}
                </Typography>
                <RadioGroup
                    name="scope-change-mode"
                    value={mode}
                    onChange={(_event, value) =>
                        setMode(value as ScopeChangeMode)
                    }
                >
                    <FormControlLabel
                        value="allRounds"
                        control={<Radio color="primary" />}
                        label={formatMessage(copy.all, {
                            count: `${allDistrictCount}`,
                        })}
                        sx={styles.radioLabel}
                    />
                    <FormControlLabel
                        value="selectedRounds"
                        control={<Radio color="primary" />}
                        label={formatMessage(copy.selected, {
                            count: `${selectedDistrictCount}`,
                        })}
                        sx={styles.radioLabel}
                    />
                    {mode === 'selectedRounds' && (
                        <Box sx={styles.roundsBox}>
                            {sortedRounds.map(round => (
                                <FormControlLabel
                                    key={round.number}
                                    sx={styles.roundCheckbox}
                                    control={
                                        <Checkbox
                                            size="small"
                                            color="primary"
                                            checked={selectedRoundNumbers.includes(
                                                round.number,
                                            )}
                                            onChange={() =>
                                                handleToggleRound(round.number)
                                            }
                                        />
                                    }
                                    label={getRoundLabel(round)}
                                />
                            ))}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={styles.roundsHelper}
                            >
                                {formatMessage(copy.helper)}
                            </Typography>
                        </Box>
                    )}
                    <FormControlLabel
                        value="empty"
                        control={<Radio color="primary" />}
                        label={formatMessage(copy.empty)}
                        sx={styles.radioLabel}
                    />
                </RadioGroup>
                {dropsDistricts && (
                    <Alert
                        severity="error"
                        icon={<WarningAmberIcon />}
                        sx={styles.warning}
                    >
                        {formatMessage(MESSAGES.scopeChangeEmptyWarning)}
                    </Alert>
                )}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={styles.disclaimer}
                >
                    {formatMessage(MESSAGES.scopeChangeNotSavedYet)}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <Button onClick={handleApply} color="primary">
                    {formatMessage(MESSAGES.apply)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
