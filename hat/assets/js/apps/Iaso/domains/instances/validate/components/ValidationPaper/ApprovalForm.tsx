import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { ValidateButton } from 'Iaso/domains/instances/components/ValidationWorkflow/ValidateButton';
import MESSAGES from '../../messages';

export const ApprovalForm: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Paper
                elevation={1}
                sx={{
                    padding: theme => theme.spacing(2),
                    margin: 0,
                    overflow: 'auto',
                    marginLeft: theme => theme.spacing(2),
                    marginRight: theme => theme.spacing(2),
                    marginTop: theme => theme.spacing(2),
                }}
            >
                <Box
                    sx={{
                        padding: theme => theme.spacing(2),
                    }}
                >
                    <InputComponent type="textarea" keyValue={'comment'} />
                </Box>
            </Paper>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: theme => theme.spacing(2),
                }}
            >
                <ValidateButton
                    color="success"
                    buttonText={formatMessage(MESSAGES.approve)}
                />
                <ValidateButton
                    color="error"
                    buttonText={formatMessage(MESSAGES.reject)}
                />
            </Box>
        </>
    );
};
