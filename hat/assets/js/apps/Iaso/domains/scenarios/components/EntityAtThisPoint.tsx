import React, { FunctionComponent, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import {
    displayValue,
    fieldsToShow,
    FormDescriptions,
    questionLabel,
} from '../utils';
import { FieldChange } from './FieldChange';

const styles: SxStyles = {
    panel: { p: 2, display: 'flex', flexDirection: 'column', gap: 1 },
    label: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
    },
    values: { display: 'flex', flexDirection: 'column', gap: 1 },
    secondary: { fontSize: 13, color: 'text.secondary' },
    toggle: { alignSelf: 'flex-start', textTransform: 'none', px: 0 },
};

type Props = {
    entityType: string;
    // when the step starts: what the steps before it left
    before: Record<string, unknown>;
    // once the form is submitted: after the step
    after?: Record<string, unknown>;
    forms: FormDescriptions;
    referenceFormId: string;
    // the entity type's configured fields: shown with the changed ones, the others on demand
    mainFields: string[];
    showTechnicalNames: boolean;
    // why there's no "after" yet
    noAfter?: IntlMessage;
};

/**
 * The entity's information when the selected step starts and, once its form is submitted, what the step changed
 * (`before → after`): its main fields and the changed ones, all of them on demand.
 */
export const EntityAtThisPoint: FunctionComponent<Props> = ({
    entityType,
    before,
    after,
    forms,
    referenceFormId,
    mainFields,
    showTechnicalNames,
    noAfter = MESSAGES.afterOnSubmit,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showAll, setShowAll] = useState(false);
    const allNames = fieldsToShow(before, after, mainFields, true);
    const names = fieldsToShow(before, after, mainFields, showAll);
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
                    {names.map(name => {
                        const value = display(before[name]);
                        const afterValue =
                            after === undefined ? value : display(after[name]);
                        return (
                            <FieldChange
                                key={name}
                                label={
                                    showTechnicalNames
                                        ? name
                                        : questionLabel(
                                              forms,
                                              [referenceFormId],
                                              name,
                                          )
                                }
                                before={value}
                                after={
                                    afterValue !== value
                                        ? afterValue
                                        : undefined
                                }
                            />
                        );
                    })}
                </Box>
            )}
            {(showAll || names.length < allNames.length) && (
                <Button
                    size="small"
                    sx={styles.toggle}
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll
                        ? formatMessage(MESSAGES.showMainFields)
                        : formatMessage(MESSAGES.showAllFields, {
                              count: String(allNames.length),
                          })}
                </Button>
            )}
            {after === undefined && (
                <Typography sx={styles.secondary}>
                    {formatMessage(noAfter)}
                </Typography>
            )}
        </Paper>
    );
};
