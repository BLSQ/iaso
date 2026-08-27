import React, { FC, useCallback, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SendIcon from '@mui/icons-material/Send';
import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    SxProps,
    Theme,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { ChatQuickReplyQuestion } from './ChatPanel';
import MESSAGES from './messages';

const defaultStyles: SxStyles = {
    root: {
        mt: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
    },
    question: {
        fontWeight: 700,
        fontSize: '0.875rem',
        color: 'text.primary',
        mb: 0.25,
        // MUI's FormLabel switches to the primary color when a child Radio is focused; pin it to
        // a static color instead, since focus/selection here shouldn't recolor the question text.
        '&.Mui-focused': {
            color: 'text.primary',
        },
    },
    option: {
        m: 0,
        px: 1,
        py: 0.25,
        borderRadius: 1.5,
        '& .MuiFormControlLabel-label': {
            fontSize: '0.875rem',
        },
    },
    optionSelected: {
        bgcolor: 'primary.light',
        fontWeight: 600,
    },
    sendButton: {
        borderRadius: '24px',
        fontWeight: 700,
        py: 1.25,
        textTransform: 'none',
    },
};

type QuickReplyFormProps = {
    groups: ChatQuickReplyQuestion[];
    onConfirm: (summary: string, selections: Record<number, number>) => void;
};

// Renders inside the assistant's own bubble. Confirming sends a synthesized "question -> answer"
// summary through the same onSendMessage path as typed text - there's no structured "form
// submission" turn in the underlying chat API, so a deterministic text summary is the simplest way
// to carry the answers forward.
export const QuickReplyForm: FC<QuickReplyFormProps> = ({
    groups,
    onConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    // Only holds in-progress picks, keyed by group index, before they're confirmed onto `groups`
    // itself (via `group.selectedOptionIndex`) - once a group already carries an answer, its value
    // always wins over anything here.
    const [selections, setSelections] = useState<Record<number, number>>({});
    // Local fallback so the form freezes on click even if the caller doesn't apply the answer to
    // `groups` synchronously.
    const [submitted, setSubmitted] = useState(false);
    const frozen =
        groups.every(group => group.selectedOptionIndex !== undefined) ||
        submitted;
    const pickFor = (group: ChatQuickReplyQuestion, groupIndex: number) =>
        group.selectedOptionIndex ?? selections[groupIndex];
    const allAnswered = groups.every(
        (group, groupIndex) => pickFor(group, groupIndex) !== undefined,
    );

    const handleConfirm = useCallback(() => {
        // Only reachable while not frozen (the button is hidden once frozen), so no group has
        // `selectedOptionIndex` set yet - every pick comes from `selections`.
        setSubmitted(true);
        onConfirm(
            groups
                .map(
                    (group, groupIndex) =>
                        `${group.question} → ${group.options[selections[groupIndex]]}`,
                )
                .join('\n'),
            selections,
        );
    }, [groups, onConfirm, selections]);

    return (
        <Box sx={defaultStyles.root as SxProps<Theme>}>
            {groups.map((group, groupIndex) => {
                const pick = pickFor(group, groupIndex);
                return (
                    <FormControl
                        key={group.question}
                        sx={defaultStyles.group as SxProps<Theme>}
                    >
                        <FormLabel
                            sx={defaultStyles.question as SxProps<Theme>}
                        >
                            {groups.length > 1
                                ? `${groupIndex + 1}. ${group.question}`
                                : group.question}
                        </FormLabel>
                        <RadioGroup
                            value={pick ?? ''}
                            onChange={e => {
                                // Frozen rows stay visually "normal" (not the greyed-out MUI
                                // disabled look) - this guard is what actually stops them from
                                // changing, since pointerEvents below only blocks mouse clicks,
                                // not keyboard input.
                                if (frozen) return;
                                setSelections(prev => ({
                                    ...prev,
                                    [groupIndex]: Number(e.target.value),
                                }));
                            }}
                            sx={frozen ? { pointerEvents: 'none' } : undefined}
                        >
                            {group.options.map((option, optionIndex) => (
                                <FormControlLabel
                                    key={option}
                                    value={optionIndex}
                                    control={
                                        <Radio
                                            size="small"
                                            icon={<RadioButtonUncheckedIcon />}
                                            checkedIcon={
                                                <CheckCircleIcon color="primary" />
                                            }
                                        />
                                    }
                                    label={option}
                                    sx={
                                        [
                                            defaultStyles.option,
                                            pick === optionIndex &&
                                                defaultStyles.optionSelected,
                                        ] as SxProps<Theme>
                                    }
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                );
            })}
            {!frozen && (
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<SendIcon sx={{ fontSize: 18 }} />}
                    disabled={!allAnswered}
                    onClick={handleConfirm}
                    sx={defaultStyles.sendButton as SxProps<Theme>}
                >
                    {formatMessage(MESSAGES.sendAnswers)}
                </Button>
            )}
        </Box>
    );
};
