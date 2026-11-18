import React, { FC } from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';
import { convertToDate } from 'Iaso/components/Cells/DateTimeCell';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { SxStyles } from 'Iaso/types/general';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import { WorkflowDetailsDraft } from '../hooks/useWorkflowDetailsForm';
import MESSAGES from '../messages';

const styles = {
    paper: {
        position: 'relative',
        mb: 2,
    },
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1.5,
        minHeight: 40,
    },
    meta: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
    },
    body: {
        p: 2,
    },
    fieldsRow: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 2,
    },
    field: {
        flex: 1,
        minWidth: 0,
    },
} satisfies SxStyles;

type Props = {
    workflow?: ValidationWorkflowRetrieve;
    details: WorkflowDetailsDraft;
    nameError?: string;
    isLoading: boolean;
    readOnly: boolean;
    onChange: (changes: Partial<WorkflowDetailsDraft>) => void;
};

export const WorkflowDetails: FC<Props> = ({
    workflow,
    details,
    nameError,
    isLoading,
    readOnly,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: formOptions, isFetching: isLoadingForms } =
        useGetFormsDropdownOptions();

    return (
        <Paper elevation={1} sx={styles.paper} data-test="workflow-details">
            {isLoading && <LoadingSpinner absolute />}
            <Box sx={styles.header}>
                <Typography variant="h6">
                    {formatMessage(MESSAGES.workflowDetails)}
                </Typography>
                {workflow && (
                    <Box sx={styles.meta}>
                        <Typography variant="caption" color="text.secondary">
                            {formatMessage(MESSAGES.createdByOn, {
                                name: workflow.created_by,
                                date: convertToDate(workflow.created_at),
                            })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatMessage(MESSAGES.updatedOn, {
                                date: convertToDate(workflow.updated_at),
                            })}
                        </Typography>
                    </Box>
                )}
            </Box>
            <Divider />
            <Box sx={styles.body}>
                <Box sx={styles.fieldsRow}>
                    <Box sx={styles.field}>
                        <InputComponent
                            keyValue="name"
                            type="text"
                            withMarginTop={false}
                            disabled={readOnly}
                            labelString={formatMessage(MESSAGES.workflowName)}
                            value={details.name}
                            onChange={(_keyValue, value) =>
                                onChange({ name: value ?? '' })
                            }
                            errors={nameError ? [nameError] : []}
                            required
                        />
                    </Box>
                    <Box sx={styles.field}>
                        <InputComponent
                            keyValue="forms"
                            type="select"
                            multi
                            clearable
                            withMarginTop={false}
                            disabled={readOnly}
                            labelString={formatMessage(MESSAGES.forms)}
                            value={details.formIds}
                            options={formOptions ?? []}
                            loading={isLoadingForms}
                            helperText={formatMessage(MESSAGES.formsHelp)}
                            onChange={(_keyValue, value) =>
                                onChange({
                                    formIds: commaSeparatedIdsToArray(value),
                                })
                            }
                        />
                    </Box>
                </Box>
                <InputComponent
                    keyValue="description"
                    type="text"
                    withMarginTop={false}
                    disabled={readOnly}
                    labelString={formatMessage(MESSAGES.description)}
                    value={details.description}
                    onChange={(_keyValue, value) =>
                        onChange({ description: value ?? '' })
                    }
                />
            </Box>
        </Paper>
    );
};
