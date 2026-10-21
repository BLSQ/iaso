import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FollowupResultOutput } from 'Iaso/api/scenarios';
import { SxStyles } from 'Iaso/types/general';
import { useConditionInWords } from '../../hooks/useConditionInWords';
import MESSAGES from '../../messages';
import {
    displayValue,
    FormDescriptions,
    isRecord,
    questionLabel,
} from '../../utils';

const styles: SxStyles = {
    hint: { display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 },
    rule: { fontSize: 14 },
    values: { fontSize: 13, color: 'text.secondary' },
    code: {
        fontFamily: 'monospace',
        fontSize: 12,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
};

type Props = {
    formId: string;
    followups: FollowupResultOutput[];
    forms: FormDescriptions;
    // the reference form: its id puts the conditions in words, its form_id labels the values read
    referenceFormId: number;
    referenceFormFormId: string;
    showTechnicalNames: boolean;
};

/** Why a form isn't offered: the follow-ups that would offer it, and the entity's values they read at this point. */
export const NotOfferedHint: FunctionComponent<Props> = ({
    formId,
    followups,
    forms,
    referenceFormId,
    referenceFormFormId,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const inWords = useConditionInWords(referenceFormId);
    const offering = followups.filter(followup =>
        followup.forms.includes(formId),
    );
    if (offering.length === 0) {
        return (
            <Typography sx={styles.rule}>
                {formatMessage(MESSAGES.noFollowupOffersIt)}
            </Typography>
        );
    }
    return (
        <Box sx={styles.hint}>
            <Typography sx={styles.rule}>
                {formatMessage(MESSAGES.offeredWhen)}
            </Typography>
            {offering.map(followup => {
                const values = isRecord(followup.read)
                    ? Object.entries(followup.read)
                    : [];
                return (
                    <Box key={followup.id}>
                        <Box sx={styles.rule}>
                            {inWords(followup.condition)}
                        </Box>
                        {showTechnicalNames && (
                            <Box component="code" sx={styles.code}>
                                {JSON.stringify(followup.condition)}
                            </Box>
                        )}
                        {followup.error && (
                            <Box component="code" sx={styles.code}>
                                {followup.error}
                            </Box>
                        )}
                        {values.length > 0 && (
                            <Typography sx={styles.values}>
                                {formatMessage(MESSAGES.nowValues, {
                                    values: values
                                        .map(([name, value]) =>
                                            showTechnicalNames
                                                ? `${name}: ${displayValue(value, true)}`
                                                : `${questionLabel(forms, [referenceFormFormId], name)} = ${displayValue(value)}`,
                                        )
                                        .join(', '),
                                })}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};
