import React, { FunctionComponent } from 'react';
import { Box, ButtonBase, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { FormDescriptions, formName, StepSummary } from '../utils';
import { StatusChip } from './StatusChip';

const COLOURS: Record<string, string> = {
    ok: 'success.main',
    not_run: 'grey.400',
    error: 'warning.main',
};

const styles: SxStyles = {
    nav: { p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 },
    label: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
        pb: 1,
    },
    step: {
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        borderRadius: 1,
        textAlign: 'left',
        justifyContent: 'flex-start',
        width: '100%',
    },
    number: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'common.white',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
    },
    code: { fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' },
};

type Props = {
    steps: StepSummary[];
    // the step shown, by index (1-based)
    selected?: number;
    forms: FormDescriptions;
    showTechnicalNames: boolean;
    onSelect: (index: number) => void;
};

/** The scenario's steps, each with its result when it last ran; a step opens to see what happened there. */
export const JourneySteps: FunctionComponent<Props> = ({
    steps,
    selected,
    forms,
    showTechnicalNames,
    onSelect,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper
            component="nav"
            sx={styles.nav}
            aria-label={formatMessage(MESSAGES.journey)}
        >
            <Typography sx={styles.label}>
                {formatMessage(MESSAGES.journey)}
            </Typography>
            {steps.map(step => (
                <ButtonBase
                    key={step.index}
                    sx={{
                        ...styles.step,
                        backgroundColor:
                            step.index === selected
                                ? 'action.selected'
                                : undefined,
                    }}
                    onClick={() => onSelect(step.index)}
                    aria-current={step.index === selected ? 'step' : undefined}
                >
                    <Box
                        sx={{
                            ...styles.number,
                            backgroundColor:
                                COLOURS[step.status] ?? 'error.main',
                        }}
                    >
                        {step.index}
                    </Box>
                    <Box sx={styles.text}>
                        <Typography variant="body2" fontWeight={500}>
                            {formName(forms, step.formId)}
                        </Typography>
                        {showTechnicalNames && (
                            <Box component="code" sx={styles.code}>
                                {step.formId}
                            </Box>
                        )}
                        {step.description && (
                            <Typography variant="caption">
                                {step.description}
                            </Typography>
                        )}
                        {step.status === 'not_run' ? (
                            <StatusChip />
                        ) : (
                            <StatusChip status={step.status} />
                        )}
                    </Box>
                </ButtonBase>
            ))}
        </Paper>
    );
};
