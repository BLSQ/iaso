import React, { FunctionComponent } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import {
    displayValue,
    FormDescriptions,
    formName,
    questionLabel,
    StepSummary,
} from '../utils';
import { LabeledValues } from './LabeledValues';
import { StatusChip } from './StatusChip';
import { ValuesTable } from './ValuesTable';

const styles: SxStyles = {
    card: { p: 3, display: 'flex', flexDirection: 'column', gap: 2 },
    header: { display: 'flex', flexDirection: 'column', gap: 0.5 },
    title: {
        fontSize: 17,
        fontWeight: 500,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
    },
    secondary: { color: 'text.secondary' },
    failure: { color: 'error.main', fontWeight: 500 },
    detail: {
        whiteSpace: 'pre-line',
        color: 'text.secondary',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    section: { display: 'flex', flexDirection: 'column', gap: 0.75 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
    },
    check: { fontSize: 14 },
    noCheck: { fontSize: 14, color: 'text.secondary' },
};

type Props = {
    step: StepSummary;
    forms: FormDescriptions;
    referenceFormId: string;
    showTechnicalNames: boolean;
};

/** One step: its form as filled, what went wrong there, and what it checks. */
export const StepDetail: FunctionComponent<Props> = ({
    step,
    forms,
    referenceFormId,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const { result, expect } = step;
    const formLabel = (name: string) =>
        showTechnicalNames ? name : questionLabel(forms, [step.formId], name);
    const entityLabel = (name: string) =>
        showTechnicalNames
            ? name
            : questionLabel(forms, [referenceFormId], name);
    const checks = [
        ...(expect.refused ?? []).map(refusal =>
            formatMessage(MESSAGES.refusedOn, {
                question: formLabel(refusal.question),
                code: refusal.code ?? '',
            }),
        ),
        ...(expect.next_forms
            ? [
                  formatMessage(MESSAGES.formsOfferedShouldBe, {
                      forms:
                          expect.next_forms
                              .map(formId => formName(forms, formId))
                              .join(', ') || '—',
                  }),
              ]
            : []),
        ...Object.entries(expect.attributes ?? {}).map(
            ([name, value]) => `${entityLabel(name)} = ${displayValue(value)}`,
        ),
        ...Object.entries(expect.submission ?? {}).map(([name, value]) =>
            formatMessage(MESSAGES.inTheForm, {
                question: formLabel(name),
                value: displayValue(value),
            }),
        ),
    ];
    const failures = (result?.failures ?? []).map(failure => {
        const [first, ...rest] = failure.replace(/^Step \d+: /, '').split('\n');
        return { first: first.replace(/:$/, ''), rest: rest.join('\n') };
    });
    return (
        <Paper sx={styles.card}>
            <Box sx={styles.header}>
                <Typography component="h2" sx={styles.title}>
                    {formatMessage(MESSAGES.step, {
                        index: String(step.index),
                        form: formName(forms, step.formId),
                    })}
                    {step.status === 'not_run' ? (
                        <StatusChip />
                    ) : (
                        <StatusChip status={step.status} />
                    )}
                </Typography>
                {step.at && (
                    <Typography variant="body2" sx={styles.secondary}>
                        {moment(step.at).format('LLL')}
                    </Typography>
                )}
                {step.description && (
                    <Typography>{step.description}</Typography>
                )}
            </Box>

            {!result && (
                <Typography sx={styles.secondary}>
                    {formatMessage(MESSAGES.stepNotRun)}
                </Typography>
            )}
            {failures.map(({ first, rest }) => (
                <Box key={first}>
                    <Typography sx={styles.failure}>{first}</Typography>
                    {showTechnicalNames && rest && (
                        <Typography sx={styles.detail}>{rest}</Typography>
                    )}
                </Box>
            ))}
            {result?.problems.map(problem => (
                <Typography
                    key={`${problem.path}-${problem.code}`}
                    variant="body2"
                    sx={styles.failure}
                >
                    {`${formLabel((problem.path ?? '').split('/').pop() ?? '')}: ${problem.message}`}
                    {showTechnicalNames && ` (${problem.code} ${problem.path})`}
                </Typography>
            ))}

            {result && (
                <LabeledValues
                    title={MESSAGES.answers}
                    values={result.answers}
                    label={formLabel}
                />
            )}
            {result && (
                <LabeledValues
                    title={MESSAGES.prefilled}
                    values={result.prefilled}
                    label={formLabel}
                />
            )}

            <Box sx={styles.section}>
                <Typography sx={styles.sectionTitle}>
                    {formatMessage(MESSAGES.thisStepChecks)}
                </Typography>
                {checks.length === 0 && (
                    <Typography sx={styles.noCheck}>
                        {formatMessage(MESSAGES.noChecks)}
                    </Typography>
                )}
                {checks.map(check => (
                    <Typography key={check} sx={styles.check}>
                        {check}
                    </Typography>
                ))}
            </Box>

            {showTechnicalNames && result && (
                <ValuesTable
                    title={MESSAGES.submission}
                    values={result.submission}
                />
            )}
        </Paper>
    );
};
