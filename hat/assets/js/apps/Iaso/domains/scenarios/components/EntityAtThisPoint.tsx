import React, { FunctionComponent } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { displayValue, FormDescriptions, questionLabel } from '../utils';

const styles: SxStyles = {
    panel: { p: 2, display: 'flex', flexDirection: 'column', gap: 1 },
    label: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
    },
    values: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '4px 8px',
        fontSize: 14,
        wordBreak: 'break-word',
    },
    heading: { fontSize: 12, color: 'text.secondary' },
    name: { color: 'text.secondary' },
    changed: { fontWeight: 600, color: 'primary.main' },
    secondary: { fontSize: 13, color: 'text.secondary' },
};

type Props = {
    entityType: string;
    // when the step starts: what the steps before it left
    before: Record<string, unknown>;
    // once the form is submitted: after the step
    after?: Record<string, unknown>;
    forms: FormDescriptions;
    referenceFormId: string;
    showTechnicalNames: boolean;
    // why there's no "after" yet
    noAfter?: IntlMessage;
};

/** The entity's information before the selected step and, once its form is submitted, after it. */
export const EntityAtThisPoint: FunctionComponent<Props> = ({
    entityType,
    before,
    after,
    forms,
    referenceFormId,
    showTechnicalNames,
    noAfter = MESSAGES.afterOnSubmit,
}) => {
    const { formatMessage } = useSafeIntl();
    const names = Array.from(
        new Set([...Object.keys(before), ...Object.keys(after ?? {})]),
    );
    const display = (value: unknown) => displayValue(value, showTechnicalNames);
    return (
        <Paper sx={styles.panel}>
            <Typography sx={styles.label}>
                {formatMessage(MESSAGES.entityInformation, { entityType })}
            </Typography>
            {names.length === 0 && (
                <Typography sx={styles.secondary}>
                    {formatMessage(MESSAGES.notRegisteredYet)}
                </Typography>
            )}
            {names.length > 0 && (
                <Box sx={styles.values}>
                    <Box />
                    <Box sx={styles.heading}>
                        {formatMessage(MESSAGES.before)}
                    </Box>
                    <Box sx={styles.heading}>
                        {formatMessage(MESSAGES.after)}
                    </Box>
                    {names.map(name => {
                        const changed =
                            after !== undefined &&
                            display(before[name]) !== display(after[name]);
                        return (
                            <React.Fragment key={name}>
                                <Box sx={styles.name}>
                                    {showTechnicalNames
                                        ? name
                                        : questionLabel(
                                              forms,
                                              [referenceFormId],
                                              name,
                                          )}
                                </Box>
                                <Box>{display(before[name])}</Box>
                                <Box sx={changed ? styles.changed : undefined}>
                                    {after ? display(after[name]) : ''}
                                </Box>
                            </React.Fragment>
                        );
                    })}
                </Box>
            )}
            {after === undefined && (
                <Typography sx={styles.secondary}>
                    {formatMessage(noAfter)}
                </Typography>
            )}
        </Paper>
    );
};
