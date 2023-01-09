import React, { FunctionComponent, useState, useCallback } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { Box, Button, makeStyles } from '@material-ui/core';

import InputComponent from '../../../components/forms/InputComponent';
import { WorkflowVersionDetail } from '../types/workflows';

import { useUpdateWorkflowVersion } from '../hooks/requests/useUpdateWorkflowVersion';

import MESSAGES from '../messages';

type Props = {
    workflow: WorkflowVersionDetail;
};

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '& #input-text-name': {
            paddingRight: theme.spacing(15),
        },
    },
    button: {
        position: 'absolute',
        right: theme.spacing(3),
        top: 26,
    },
}));
export const DetailsForm: FunctionComponent<Props> = ({ workflow }) => {
    const classes = useStyles();
    const [name, setName] = useState<string>(workflow.name);
    const { formatMessage } = useSafeIntl();
    const { mutate: updateWorkflowVersion } = useUpdateWorkflowVersion(
        'workflowVersion',
        workflow.version_id,
    );
    const handleSave = useCallback(() => {
        updateWorkflowVersion({ name, versionId: workflow.version_id });
    }, [name, updateWorkflowVersion, workflow.version_id]);
    const saveDisabled = name === workflow.name || name === '';
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
