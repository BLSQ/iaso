import React, { FunctionComponent, useState, useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';

import InputComponent from '../../../components/forms/InputComponent';
import { WorkflowVersionDetail } from '../types';

import { useUpdateWorkflowVersion } from '../hooks/requests/useUpdateWorkflowVersion';

import MESSAGES from '../messages';

type Props = {
    workflowVersion: WorkflowVersionDetail;
};
// @ts-ignore
const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '& #input-text-name': {
            paddingRight: theme.spacing(15),
        },
    },
    button: {
        position: 'absolute !important',
        right: theme.spacing(3),
        top: 26,
    },
}));
export const DetailsForm: FunctionComponent<Props> = ({ workflowVersion }) => {
    const classes = useStyles();
    const [name, setName] = useState<string>(workflowVersion.name);
    const { formatMessage } = useSafeIntl();
    const { mutate: updateWorkflowVersion } = useUpdateWorkflowVersion(
        'workflowVersion',
        workflowVersion.version_id,
    );
    const handleSave = useCallback(() => {
        updateWorkflowVersion({ name, versionId: workflowVersion.version_id });
    }, [name, updateWorkflowVersion, workflowVersion.version_id]);
    const saveDisabled = name === workflowVersion.name || name === '';
    return (
        <Box p={2} className={classes.root}>
            <InputComponent
                withMarginTop={false}
                keyValue="name"
                onChange={(_, value) => setName(value)}
                value={name}
                type="text"
                label={MESSAGES.name}
                required
            />
            <Button
                className={classes.button}
                disabled={saveDisabled}
                color="primary"
                data-test="save-name-button"
                onClick={handleSave}
                variant="contained"
            >
                {formatMessage(MESSAGES.save)}
            </Button>
        </Box>
    );
};
