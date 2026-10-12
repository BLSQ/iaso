import React, { FunctionComponent } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import {
    displayValue,
    FormDescriptions,
    isRecord,
    questionLabel,
    StepSummary,
} from '../utils';

const styles: SxStyles = {
    scroll: { overflowX: 'auto' },
    changed: { backgroundColor: 'warning.light', fontWeight: 500 },
    name: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: 'text.secondary',
        display: 'block',
    },
};

type Props = {
    steps: StepSummary[];
    forms: FormDescriptions;
    referenceFormFormId: string;
    showTechnicalNames: boolean;
};

/** The entity's information after each step that ran, a value changed by the step highlighted. */
export const ProfileAtEachStep: FunctionComponent<Props> = ({
    steps,
    forms,
    referenceFormFormId,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const ran = steps.filter(
        step => step.result && isRecord(step.result.profile),
    );
    const profiles = ran.map(step =>
        isRecord(step.result?.profile) ? step.result.profile : {},
    );
    const names = Array.from(
        new Set(profiles.flatMap(profile => Object.keys(profile))),
    );
    return (
        <Box sx={styles.scroll}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.question)}
                        </TableCell>
                        {ran.map(step => (
                            <TableCell key={step.index}>
                                {formatMessage(MESSAGES.afterStep, {
                                    index: String(step.index),
                                })}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {names.map(name => (
                        <TableRow key={name}>
                            <TableCell>
                                {questionLabel(
                                    forms,
                                    [referenceFormFormId],
                                    name,
                                )}
                                {showTechnicalNames && (
                                    <Box component="code" sx={styles.name}>
                                        {name}
                                    </Box>
                                )}
                            </TableCell>
                            {profiles.map((profile, position) => {
                                const before =
                                    position > 0
                                        ? profiles[position - 1][name]
                                        : undefined;
                                const changed =
                                    position > 0 && before !== profile[name];
                                return (
                                    <TableCell
                                        key={ran[position].index}
                                        sx={
                                            changed ? styles.changed : undefined
                                        }
                                    >
                                        {displayValue(
                                            profile[name],
                                            showTechnicalNames,
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
