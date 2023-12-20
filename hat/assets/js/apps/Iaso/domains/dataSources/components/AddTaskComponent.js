import React, { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { LoadingSpinner } from 'bluesquare-components';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { EditableTextFields } from '../../../components/forms/EditableTextFields';
import { Checkboxes } from '../../../components/forms/Checkboxes';
import { redirectTo } from '../../../routing/actions.ts';
import { baseUrls } from '../../../constants/urls';
import { sendDhisOuImporterRequest } from '../requests';
import { useFormState } from '../../../hooks/form';
import { useSnackMutation } from '../../../libs/apiHooks.ts';
import { VersionDescription } from './VersionDescription.tsx';

const initialFormState = sourceCredentials => {
    return {
        dhis2_url: sourceCredentials.url ? sourceCredentials.url : null,
        dhis2_login: sourceCredentials.login ? sourceCredentials.login : null,
        dhis2_password: null,
        validate_status: false,
        continue_on_error: false,
        versionDescription: '',
    };
};

const AddTask = ({
    renderTrigger,
    sourceId,
    sourceVersionNumber,
    sourceCredentials,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, _, setFormState] = useFormState(
        initialFormState(sourceCredentials),
    );
    const [withExistingDhis2Settings, setWithExistingDhis2Settings] = useState(
        sourceCredentials.is_valid,
    );

    const dispatch = useDispatch();
    const mutation = useSnackMutation(
        sendDhisOuImporterRequest,
        MESSAGES.importFromDhis2Success,
        MESSAGES.importFromDhis2Error,
    );

    const reset = () => {
        setFormState(initialFormState(sourceCredentials));
        setWithExistingDhis2Settings(true);
    };

    const submit = async (closeDialogCallBack, redirect = false) => {
        const body = {
            source_id: sourceId,
            source_version_number: sourceVersionNumber,
            force: false,
            validate_status: form.validate_status.value,
            continue_on_error: form.continue_on_error.value,
            description: form.versionDescription.value || null,
        };
        if (!withExistingDhis2Settings) {
            body.dhis2_password = form.dhis2_password.value;
            body.dhis2_url = form.dhis2_url.value;
            body.dhis2_login = form.dhis2_login.value;
        }

        await mutation.mutateAsync(body);
        closeDialogCallBack();
        if (redirect) {
            dispatch(
                redirectTo(baseUrls.tasks, {
                    order: '-created_at',
                }),
            );
        }
        reset();
    };

    const onConfirm = async closeDialog => {
        await submit(closeDialog);
    };

    const onRedirect = async closeDialog => {
        await submit(closeDialog, true);
    };

    const titleMessage = sourceVersionNumber ? (
        <FormattedMessage
            id="iaso.sourceVersion.label.update"
            defaultMessage="Update version {version}"
            values={{ version: sourceVersionNumber }}
        />
    ) : (
        <FormattedMessage
            id="iaso.sourceVersion.label.create"
            defaultMessage="Create a new version from DHIS2"
        />
    );

    const formIsValid = Boolean(
        withExistingDhis2Settings ||
            (form.dhis2_url.value &&
                form.dhis2_login.value &&
                form.dhis2_password.value),
    );
    const allowConfirm = !mutation.isLoading && formIsValid;

    const renderDefaultLayout = (showDefaultOverride, versionNumber) => {
        const checkboxes = [
            {
                keyValue: 'continue_on_error',
                label: MESSAGES.continueOnError,
                value: form.continue_on_error.value,
                onChange: value => {
                    setFormField('continue_on_error', value);
                },
            },
            {
                keyValue: 'validate_status',
                label: MESSAGES.validateStatus,
                value: form.validate_status.value,
                onChange: value => {
                    setFormField('validate_status', value);
                },
            },
        ];
        if (showDefaultOverride) {
            checkboxes.push({
                keyValue: 'change_source',
                label: MESSAGES.useDefaultDhisSettings,
                value: withExistingDhis2Settings,
                onChange: setWithExistingDhis2Settings,
            });
        }
        return (
            <>
                {!versionNumber && (
                    <VersionDescription
                        formValue={form.versionDescription.value}
                        onChangeDescription={(field, value) => {
                            setFormField(field, value);
                        }}
                    />
                )}
                <Checkboxes checkboxes={checkboxes} />
            </>
        );
    };

    const renderWithOptionalFields = () => (
        <EditableTextFields
            fields={[
                {
                    keyValue: 'dhis2_url',
                    label: MESSAGES.dhisUrl,
                    value: form.dhis2_url.value,
                    onChange: (field, value) => {
                        setFormField(field, value);
                    },
                },
                {
                    keyValue: 'dhis2_login',
                    label: MESSAGES.dhisLogin,
                    value: form.dhis2_login.value,
                    onChange: (field, value) => {
                        setFormField(field, value);
                    },
                },
                {
                    keyValue: 'dhis2_password',
                    label: MESSAGES.dhisPassword,
                    value: form.dhis2_password.value,
                    onChange: (field, value) => {
                        setFormField(field, value);
                    },
                    password: true,
                },
            ]}
        />
    );
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onClosed={reset}
            confirmMessage={MESSAGES.launch}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={onRedirect}
        >
            {mutation.isLoading && <LoadingSpinner />}

            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        {sourceVersionNumber ? (
                            <FormattedMessage
                                id="iaso.sourceVersion.label.update_explication"
                                defaultMessage="Update this version by syncing with DHIS2. New Orgunit from DHIS2 will be imported but OrgUnit already present on this version won't be modified."
                            />
                        ) : (
                            <FormattedMessage
                                id="iaso.sourceVersion.label.create_explication"
                                defaultMessage="Import OrgUnits from a DHIS2 server."
                            />
                        )}
                    </Typography>
                    <Typography>
                        <FormattedMessage
                            id="iaso.sourceVersion.label.import_task_explication"
                            defaultMessage="The import will be realised in the background and can take a dozen minutes to complete."
                        />
                    </Typography>
                </Grid>

                <Grid xs={12} item>
                    {!withExistingDhis2Settings &&
                        renderWithOptionalFields(sourceCredentials.is_valid)}
                    {renderDefaultLayout(
                        sourceCredentials.is_valid,
                        sourceVersionNumber,
                    )}
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
AddTask.defaultProps = {
    sourceCredentials: {},
    sourceVersionNumber: null,
};
AddTask.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    sourceId: PropTypes.number.isRequired,
    sourceVersionNumber: PropTypes.number,
    sourceCredentials: PropTypes.object,
};

export { AddTask };
