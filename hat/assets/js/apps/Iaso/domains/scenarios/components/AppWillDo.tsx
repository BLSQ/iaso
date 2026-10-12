import React, { FunctionComponent } from 'react';
import { Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { StepResultOutput } from 'Iaso/api/scenarios';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import {
    displayValue,
    FormDescriptions,
    formName,
    questionLabel,
} from '../utils';

const styles: SxStyles = {
    panel: { p: 2, display: 'flex', flexDirection: 'column', gap: 2 },
    label: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
    },
    title: { fontSize: 14, fontWeight: 500 },
    row: { display: 'flex', gap: 1, alignItems: 'center', fontSize: 14 },
    offered: {
        backgroundColor: 'success.light',
        color: 'success.contrastText',
    },
    changes: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '6px 8px',
        fontSize: 14,
    },
    secondary: { color: 'text.secondary' },
    rowNotOffered: {
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        fontSize: 14,
        color: 'text.secondary',
    },
    problem: { color: 'error.main', fontSize: 14 },
};

type Props = {
    result?: StepResultOutput;
    forms: FormDescriptions;
    referenceFormId: string;
    isLoading: boolean;
    // the scenario page: what the app did when the scenario last ran, not what it will do
    hasRun?: boolean;
};

/** What the app does with the step just filled: the forms it offers next, how the entity's information changes. */
export const AppWillDo: FunctionComponent<Props> = ({
    result,
    forms,
    referenceFormId,
    isLoading,
    hasRun = false,
}) => {
    const title = hasRun ? MESSAGES.whatTheAppDid : MESSAGES.whatTheAppWillDo;
    const { formatMessage } = useSafeIntl();
    const offered = result?.next?.forms ?? [];
    const notOffered = Array.from(
        new Set(
            (result?.next?.followups ?? []).flatMap(followup => followup.forms),
        ),
    ).filter(formId => !offered.includes(formId));
    return (
        <Paper
            component="aside"
            sx={styles.panel}
            aria-label={formatMessage(title)}
        >
            <Box>
                <Typography sx={styles.label}>
                    {formatMessage(title)}
                </Typography>
                {!hasRun && (
                    <Typography variant="caption" sx={styles.secondary}>
                        {formatMessage(MESSAGES.submitToSee)}
                    </Typography>
                )}
                {hasRun && !result && (
                    <Typography variant="caption" sx={styles.secondary}>
                        {formatMessage(MESSAGES.stepNotRun)}
                    </Typography>
                )}
            </Box>
            {isLoading && <LinearProgress />}
            {result?.status === 'refused' && (
                <Box>
                    <Typography sx={styles.title}>
                        {formatMessage(MESSAGES.formRefuses)}
                    </Typography>
                    {result.problems.map(problem => (
                        <Typography
                            key={`${problem.path}-${problem.code}`}
                            sx={styles.problem}
                        >
                            {problem.message}
                        </Typography>
                    ))}
                </Box>
            )}
            {result?.next && (
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography sx={styles.title}>
                        {formatMessage(MESSAGES.formsOfferedNext)}
                    </Typography>
                    {offered.map(formId => (
                        <Box key={formId} sx={styles.row}>
                            <Chip
                                size="small"
                                sx={styles.offered}
                                label={formatMessage(MESSAGES.offered)}
                            />
                            {formName(forms, formId)}
                        </Box>
                    ))}
                    {notOffered.map(formId => (
                        <Box key={formId} sx={styles.rowNotOffered}>
                            <Chip
                                size="small"
                                label={formatMessage(MESSAGES.notOffered)}
                            />
                            {formName(forms, formId)}
                        </Box>
                    ))}
                </Box>
            )}
            {result?.changes && result.changes.length > 0 && (
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography sx={styles.title}>
                        {formatMessage(MESSAGES.informationWillChange)}
                    </Typography>
                    <Box sx={styles.changes}>
                        {result.changes.map(change => (
                            <React.Fragment key={change.target}>
                                <Box sx={styles.secondary}>
                                    {questionLabel(
                                        forms,
                                        [referenceFormId],
                                        change.target,
                                    )}
                                </Box>
                                <Box sx={styles.secondary}>
                                    {displayValue(change.before)}
                                </Box>
                                <Box fontWeight={500}>
                                    {displayValue(change.after)}
                                </Box>
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            )}
            <Typography variant="caption" sx={styles.secondary}>
                {formatMessage(MESSAGES.nothingSaved)}
            </Typography>
        </Paper>
    );
};
