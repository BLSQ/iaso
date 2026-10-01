import React, { FunctionComponent, useState, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { useUpdateWorkflowVersion } from '../hooks/requests/useUpdateWorkflowVersion';
import MESSAGES from '../messages';
import { WorkflowVersionDetail } from '../types';

type Props = {
    workflowVersion: WorkflowVersionDetail;
};

export const DetailsForm: FunctionComponent<Props> = ({ workflowVersion }) => {
    const [name, setName] = useState<string>(workflowVersion.name);
    const [autoFirstStep, setAutoFirstStep] = useState<boolean>(
        workflowVersion.auto_first_step,
    );
    const { formatMessage } = useSafeIntl();
    const { mutate: updateWorkflowVersion } = useUpdateWorkflowVersion(
        'workflowVersion',
        workflowVersion.version_id,
    );
    const handleSave = useCallback(() => {
        updateWorkflowVersion({
            name,
            versionId: workflowVersion.version_id,
            auto_first_step: autoFirstStep,
        });
    }, [
        autoFirstStep,
        name,
        updateWorkflowVersion,
        workflowVersion.version_id,
    ]);
    const saveDisabled =
        (name === workflowVersion.name || name === '') &&
        autoFirstStep === workflowVersion.auto_first_step;
    return (
        <Box p={2}>
            <InputComponent
                withMarginTop={false}
                keyValue="name"
                onChange={(_, value) => setName(value)}
                value={name}
                type="text"
                label={MESSAGES.name}
                required
            />
            <InputComponent
                type="checkbox"
                keyValue="auto_first_step"
                value={autoFirstStep}
                label={MESSAGES.autoFirstStep}
                onChange={() => setAutoFirstStep(!autoFirstStep)}
            />
            <Box display="flex" justifyContent="flex-end">
                <Button
                    disabled={saveDisabled}
                    color="primary"
                    data-test="save-name-button"
                    onClick={handleSave}
                    variant="contained"
                >
                    {formatMessage(MESSAGES.save)}
                </Button>
            </Box>
        </Box>
    );
};
