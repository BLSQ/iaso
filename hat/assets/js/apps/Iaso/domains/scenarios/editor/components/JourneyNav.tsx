import React, { FunctionComponent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, ButtonBase, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { EditorStep } from '../utils';

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
    currentStep: {
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        borderRadius: 1,
        textAlign: 'left',
        justifyContent: 'flex-start',
        width: '100%',
        backgroundColor: 'action.selected',
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
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
    },
    text: { display: 'flex', flexDirection: 'column', gap: 0.25 },
    secondary: { color: 'text.secondary' },
};

type Props = {
    steps: EditorStep[];
    current: number;
    formNames: Record<string, string>;
    onSelect: (index: number) => void;
};

/** The steps recorded, the one being filled highlighted; a step opens again to change it. */
export const JourneyNav: FunctionComponent<Props> = ({
    steps,
    current,
    formNames,
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
            {steps.map((step, index) => (
                <ButtonBase
                    key={`${index + 1}-${step.form}`}
                    sx={index === current ? styles.currentStep : styles.step}
                    onClick={() => onSelect(index)}
                    aria-current={index === current ? 'step' : undefined}
                >
                    <Box sx={styles.number}>{index + 1}</Box>
                    <Box sx={styles.text}>
                        <Typography variant="body2" fontWeight={500}>
                            {formNames[step.form] ?? step.form}
                        </Typography>
                        {step.description && (
                            <Typography variant="caption">
                                {step.description}
                            </Typography>
                        )}
                        <Typography variant="caption" sx={styles.secondary}>
                            {formatMessage(MESSAGES.checksCount, {
                                count: String(countChecks(step)),
                            })}
                        </Typography>
                    </Box>
                </ButtonBase>
            ))}
            {current === steps.length && (
                <Box sx={styles.currentStep}>
                    <Box sx={styles.number}>{steps.length + 1}</Box>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.fillingNow)}
                    </Typography>
                </Box>
            )}
            <Button
                startIcon={<AddIcon />}
                disabled={current === steps.length}
                onClick={() => onSelect(steps.length)}
            >
                {formatMessage(MESSAGES.addStep)}
            </Button>
        </Paper>
    );
};

const countChecks = (step: EditorStep): number =>
    (step.expect.next_forms ? 1 : 0) +
    Object.keys(step.expect.attributes ?? {}).length +
    (step.expect.refused ? 1 : 0);
