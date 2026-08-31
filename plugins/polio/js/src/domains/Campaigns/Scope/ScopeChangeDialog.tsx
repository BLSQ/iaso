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
import moment from 'moment';
import { SxStyles } from 'Iaso/types/general';
import { getLocaleDateFormat } from 'Iaso/utils/dates';

import MESSAGES from '../../../constants/messages';

export type ScopeChangeMode = 'allRounds' | 'selectedRounds' | 'empty';

export type ScopeChangeRound = {
    number: number;
    started_at?: string | null;
    ended_at?: string | null;
};

export type ScopeChangeResult = {
    mode: ScopeChangeMode;
    selectedRoundNumbers: number[];
};

type Props = {
    open: boolean;
    rounds: ScopeChangeRound[];
    districtCount?: number;
    onClose?: () => void;
    onConfirm?: (result: ScopeChangeResult) => void;
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

const formatRoundDate = (
    date: string | null | undefined,
): string | undefined => {
    if (!date) {
        return undefined;
    }
    const parsed = moment(date);
    if (!parsed.isValid()) {
        return undefined;
    }
    return parsed.format(getLocaleDateFormat('L'));
};

const formatRoundDateRange = (
    startedAt: string | null | undefined,
    endedAt: string | null | undefined,
    toLabel: string,
): string | undefined => {
    const start = formatRoundDate(startedAt);
    const end = formatRoundDate(endedAt);
    if (start && end) {
        return `${start} ${toLabel} ${end}`;
    }
    return start || end;
};

export const ScopeChangeDialog: FunctionComponent<Props> = ({
    open,
    rounds,
    districtCount = 0,
    onClose = () => {},
    onConfirm = () => {},
}) => {
    const { formatMessage } = useSafeIntl();
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            data-test="scope-change-dialog"
        >
            <DialogTitle>{formatMessage(MESSAGES.scope_per_round)}</DialogTitle>
            <DialogContent>
                <Typography sx={styles.description}>
                    {formatMessage(MESSAGES.scopeChangeDescription, {
                        count: `${districtCount}`,
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
                        label={formatMessage(MESSAGES.scopeChangeCopyAllRounds)}
                        sx={styles.radioLabel}
                    />
                    <FormControlLabel
                        value="selectedRounds"
                        control={<Radio color="primary" />}
                        label={formatMessage(
                            MESSAGES.scopeChangeCopySelectedRounds,
                        )}
                        sx={styles.radioLabel}
                    />
                    {mode === 'selectedRounds' && (
                        <Box sx={styles.roundsBox}>
                            {sortedRounds.map(round => {
                                const dateRange = formatRoundDateRange(
                                    round.started_at,
                                    round.ended_at,
                                    toLabel,
                                );
                                const label = dateRange
                                    ? formatMessage(
                                          MESSAGES.scopeChangeRoundDateRange,
                                          {
                                              number: `${round.number}`,
                                              dateRange,
                                          },
                                      )
                                    : `${formatMessage(MESSAGES.round)} ${
                                          round.number
                                      }`;
                                return (
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
                                                    handleToggleRound(
                                                        round.number,
                                                    )
                                                }
                                            />
                                        }
                                        label={label}
                                    />
                                );
                            })}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={styles.roundsHelper}
                            >
                                {formatMessage(
                                    MESSAGES.scopeChangeUncheckedRoundsEmpty,
                                )}
                            </Typography>
                        </Box>
                    )}
                    <FormControlLabel
                        value="empty"
                        control={<Radio color="primary" />}
                        label={formatMessage(MESSAGES.scopeChangeEmptyRounds)}
                        sx={styles.radioLabel}
                    />
                </RadioGroup>
                {mode === 'empty' && (
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
