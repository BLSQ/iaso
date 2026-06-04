import React from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { BooleanInput } from 'Iaso/components/forms/BooleanInput';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from 'Iaso/domains/accounts/messages';
import TextInput from 'Iaso/domains/pages/components/TextInput';
export const GeneralInfoEditPanel = () => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper title={formatMessage(MESSAGES.generalInfoTitle)}>
            <Box m={2}>
                <Field
                    label={formatMessage(MESSAGES.name)}
                    name="name"
                    component={TextInput}
                    required
                    margin={'normal'}
                />
                <Field
                    label={formatMessage(MESSAGES.userManualPath)}
                    name="user_manual_path"
                    component={TextInput}
                    margin={'normal'}
                />
                <Field
                    label={formatMessage(MESSAGES.forumPath)}
                    name={'forum_path'}
                    component={TextInput}
                    margin={'normal'}
                />
                <Field
                    label={formatMessage(MESSAGES.forceStrongPassword)}
                    name={'enforce_password_validation'}
                    component={BooleanInput}
                    margin={'normal'}
                />
            </Box>
        </WidgetPaper>
    );
};
