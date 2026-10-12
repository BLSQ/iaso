import React, { FunctionComponent, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Paper,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { StepResultOutput } from 'Iaso/api/scenarios';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import {
    displayValue,
    FormDescriptions,
    formName,
    isRecord,
    questionLabel,
} from '../../utils';
import { StepExpect } from '../utils';

const styles: SxStyles = {
    card: { p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 },
    title: { fontSize: 17, fontWeight: 500 },
    row: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
    },
    name: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: 'text.secondary',
        ml: 1,
    },
    secondary: { color: 'text.secondary' },
};

type Props = {
    result: StepResultOutput;
    forms: FormDescriptions;
    referenceFormId: string;
    expect: StepExpect;
    onChange: (expect: StepExpect) => void;
    showTechnicalNames: boolean;
};

const refusalsOf = (
    result: StepResultOutput,
): { question: string; code: string }[] =>
    result.problems.map(problem => ({
        question: (problem.path ?? '').split('/').pop() ?? '',
        code: problem.code,
    }));

/** A value as a check expects it: text, null when empty. */
const asExpected = (value: unknown): string | null =>
    value === null || value === undefined || value === ''
        ? null
        : String(value);

/** The checks the app first suggests, from what happened: the forms offered, the values the step changed. */
export const defaultChecks = (result: StepResultOutput): StepExpect => {
    if (result.status === 'refused') {
        return { refused: refusalsOf(result) };
    }
    return {
        next_forms: result.next?.forms,
        attributes: Object.fromEntries(
            (result.changes ?? []).map(change => [
                change.target,
                asExpected(change.after),
            ]),
        ),
    };
};

/** What this scenario should check after the step: ticked from what happened, untick what may change. */
export const StepChecks: FunctionComponent<Props> = ({
    result,
    forms,
    referenceFormId,
    expect,
    onChange,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showUnchanged, setShowUnchanged] = useState(false);
    const profile = isRecord(result.profile) ? result.profile : {};
    const changed = new Set(
        (result.changes ?? []).map(change => change.target),
    );
    const names = Object.keys(profile);
    const unchanged = names.filter(name => !changed.has(name));
    const shown = [
        ...names.filter(name => changed.has(name)),
        ...(showUnchanged ? unchanged : []),
    ];
    const attributes = expect.attributes ?? {};

    const toggleAttribute = (name: string, checked: boolean) => {
        const { [name]: _removed, ...others } = attributes;
        onChange({
            ...expect,
            attributes: checked
                ? { ...others, [name]: asExpected(profile[name]) }
                : others,
        });
    };

    if (result.status === 'refused') {
        return (
            <Paper sx={styles.card}>
                <Typography component="h2" sx={styles.title}>
                    {formatMessage(MESSAGES.shouldBeRefused)}
                </Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={Boolean(expect.refused)}
                            onChange={event =>
                                onChange(
                                    event.target.checked
                                        ? { refused: refusalsOf(result) }
                                        : {},
                                )
                            }
                        />
                    }
                    label={formatMessage(MESSAGES.expectRefusal)}
                />
                {!expect.refused && (
                    <Typography sx={{ color: 'error.main' }}>
                        {formatMessage(MESSAGES.fixAnswersOrExpectRefusal)}
                    </Typography>
                )}
            </Paper>
        );
    }
    return (
        <Paper sx={styles.card}>
            <Typography component="h2" sx={styles.title}>
                {formatMessage(MESSAGES.whatShouldBeChecked)}
            </Typography>
            <Typography variant="body2" sx={styles.secondary}>
                {formatMessage(MESSAGES.whatShouldBeCheckedText)}
            </Typography>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={Boolean(expect.next_forms)}
                        onChange={event =>
                            onChange({
                                ...expect,
                                next_forms: event.target.checked
                                    ? (result.next?.forms ?? [])
                                    : undefined,
                            })
                        }
                    />
                }
                label={formatMessage(MESSAGES.formsOfferedShouldBe, {
                    forms:
                        (result.next?.forms ?? [])
                            .map(formId => formName(forms, formId))
                            .join(', ') || '—',
                })}
            />
            <Box>
                {shown.map(name => (
                    <Box key={name} sx={styles.row}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={name in attributes}
                                    onChange={event =>
                                        toggleAttribute(
                                            name,
                                            event.target.checked,
                                        )
                                    }
                                />
                            }
                            label={
                                <>
                                    {questionLabel(
                                        forms,
                                        [referenceFormId],
                                        name,
                                    )}
                                    {showTechnicalNames && (
                                        <Box component="code" sx={styles.name}>
                                            {name}
                                        </Box>
                                    )}
                                </>
                            }
                        />
                        <Typography fontWeight={500}>
                            {displayValue(profile[name], showTechnicalNames)}
                        </Typography>
                    </Box>
                ))}
            </Box>
            {unchanged.length > 0 && (
                <Button
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={() => setShowUnchanged(!showUnchanged)}
                >
                    {formatMessage(
                        showUnchanged
                            ? MESSAGES.hideUnchanged
                            : MESSAGES.showUnchanged,
                        {
                            count: String(unchanged.length),
                        },
                    )}
                </Button>
            )}
        </Paper>
    );
};
