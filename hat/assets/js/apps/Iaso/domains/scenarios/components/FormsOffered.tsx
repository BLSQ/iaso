import React, { FunctionComponent } from 'react';
import {
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { NextFormsOutput } from 'Iaso/api/scenarios';
import { SxStyles } from 'Iaso/types/general';
import { useConditionInWords } from '../hooks/useConditionInWords';
import MESSAGES from '../messages';
import {
    displayValue,
    FormDescriptions,
    formName,
    isRecord,
    questionLabel,
} from '../utils';

const styles: SxStyles = {
    card: {
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflowX: 'auto',
    },
    title: { fontSize: 17, fontWeight: 500 },
    yes: {
        backgroundColor: 'success.light',
        color: 'success.contrastText',
        mr: 1,
    },
    no: { backgroundColor: 'error.light', color: 'error.contrastText', mr: 1 },
    code: {
        fontFamily: 'monospace',
        fontSize: 12,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        display: 'block',
        mt: 0.5,
    },
    secondary: { color: 'text.secondary' },
};

type Props = {
    title: string;
    offered: NextFormsOutput;
    forms: FormDescriptions;
    referenceFormId: number;
    referenceFormFormId: string;
    showTechnicalNames: boolean;
};

/** Each follow-up rule as the app evaluated it: true or not, the values it read, the forms it offers. */
export const FormsOffered: FunctionComponent<Props> = ({
    title,
    offered,
    forms,
    referenceFormId,
    referenceFormFormId,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const inWords = useConditionInWords(referenceFormId);
    return (
        <Paper sx={styles.card}>
            <Typography component="h2" sx={styles.title}>
                {title}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{formatMessage(MESSAGES.rule)}</TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.valuesUsed)}
                        </TableCell>
                        <TableCell>{formatMessage(MESSAGES.forms)}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {offered.followups.map(followup => {
                        const values = isRecord(followup.read)
                            ? Object.entries(followup.read)
                            : [];
                        return (
                            <TableRow key={followup.id}>
                                <TableCell>
                                    {followup.error ? (
                                        <Chip
                                            size="small"
                                            sx={styles.no}
                                            label={formatMessage(
                                                MESSAGES.appWouldFail,
                                            )}
                                        />
                                    ) : (
                                        <Chip
                                            size="small"
                                            sx={
                                                followup.value
                                                    ? styles.yes
                                                    : styles.no
                                            }
                                            label={formatMessage(
                                                followup.value
                                                    ? MESSAGES.yes
                                                    : MESSAGES.no,
                                            )}
                                        />
                                    )}
                                    {inWords(followup.condition)}
                                    {followup.error && (
                                        <Typography sx={styles.code}>
                                            {followup.error}
                                        </Typography>
                                    )}
                                    {showTechnicalNames && (
                                        <Typography
                                            component="code"
                                            sx={styles.code}
                                        >
                                            {JSON.stringify(followup.condition)}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell sx={styles.secondary}>
                                    {values.length === 0 && '—'}
                                    {values.map(([name, value]) => (
                                        <div key={name}>
                                            {showTechnicalNames
                                                ? `${name}: ${displayValue(value, true)}`
                                                : `${questionLabel(forms, [referenceFormFormId], name)} = ${displayValue(value)}`}
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    {followup.forms.map(formId => (
                                        <div key={formId}>
                                            {formName(forms, formId)}
                                            {showTechnicalNames && (
                                                <Typography
                                                    component="code"
                                                    sx={styles.code}
                                                >
                                                    {`${formId} · ${formatMessage(MESSAGES.followupOrder, { order: String(followup.order) })}`}
                                                </Typography>
                                            )}
                                        </div>
                                    ))}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Paper>
    );
};
