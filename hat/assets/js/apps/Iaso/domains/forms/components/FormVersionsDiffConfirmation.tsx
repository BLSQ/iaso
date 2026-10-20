import React, { FunctionComponent } from 'react';
import { Alert, Box, Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { FormVersionDiff } from '../requests';
import FormVersionsConfigurationImpactsTable from './FormVersionsConfigurationImpactsTable';
import FormVersionsDiffTables from './FormVersionsDiffTables';

type Props = {
    formId: number;
    diff: FormVersionDiff;
};

const FormVersionsDiffConfirmation: FunctionComponent<Props> = ({
    formId,
    diff,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box mt={1}>
            <Alert severity="warning" sx={{ mb: 2 }}>
                {formatMessage(MESSAGES.diffWarning, {
                    versionId: diff.previous_version_id ?? '—',
                })}
            </Alert>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    mb: 3,
                }}
            >
                <Chip
                    size="small"
                    color="success"
                    label={`+${diff.added_questions.length} ${formatMessage(MESSAGES.questionAdded)}`}
                />
                <Chip
                    size="small"
                    color="error"
                    label={`-${diff.removed_questions.length} ${formatMessage(MESSAGES.questionRemoved)}`}
                />
                <Chip
                    size="small"
                    color="warning"
                    label={`~${diff.modified_questions.length} ${formatMessage(MESSAGES.questionModified)}`}
                />
                {diff.configuration_impacts?.length > 0 && (
                    <Chip
                        size="small"
                        color="warning"
                        label={`${diff.configuration_impacts.length} ${formatMessage(MESSAGES.configurationImpacts)}`}
                    />
                )}
            </Box>
            <FormVersionsDiffTables
                removedQuestions={diff.removed_questions}
                modifiedQuestions={diff.modified_questions}
            />
            {diff.configuration_impacts?.length > 0 && (
                <FormVersionsConfigurationImpactsTable
                    formId={formId}
                    configurationImpacts={diff.configuration_impacts}
                />
            )}
        </Box>
    );
};

export default FormVersionsDiffConfirmation;
