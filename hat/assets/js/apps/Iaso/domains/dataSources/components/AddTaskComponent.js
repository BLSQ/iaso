import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Grid } from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import { useMutation } from 'react-query';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { EditableTextFields } from '../../../components/forms/EditableTextFields';
import { Checkboxes } from '../../../components/forms/Checkboxes';
import { redirectTo } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';
import { sendDhisOuImporterRequest } from '../requests';
import { useFormState } from '../../../hooks/form';

const initialFormState = sourceCredentials => {
    return {
        dhis2_url: sourceCredentials.url ? sourceCredentials.url : null,
        dhis2_login: sourceCredentials.login ? sourceCredentials.login : null,
        dhis2_password: null,
        validate_status: false,
        continue_on_error: false,
    };
};

const AddTask = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceVersion,
    sourceCredentials,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, _, setFormState] = useFormState(
        initialFormState(sourceCredentials),
    );
    const [withExistingDhis2Settings, setWithExistingDhis2Settings] = useState(
        !isEqual(sourceCredentials, {}),
    );
    const dispatch = useDispatch();
    const mutation = useMutation(sendDhisOuImporterRequest);

    const reset = useCallback(() => {
        setFormState(initialFormState(sourceCredentials));
    }, [sourceCredentials]);

    const submit = useCallback(
        async (closeDialogCallBack, redirect = false) => {
            const body = {
                source_id: sourceId,
                source_version_number: sourceVersion,
                force: false,
                validate_status: form.validate_status.value,
                continue_on_error: form.continue_on_error.value,
            };
            if (!withExistingDhis2Settings) {
                body.dhis2_password = form.dhis2_password.value;
                body.dhis2_url = form.dhis2_url.value;
                body.dhis2_login = form.dhis2_login.value;
                setWithExistingDhis2Settings(true);
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
        },
        [
            sourceId,
            sourceVersion,
            form.dhis2_url.value,
            form.dhis2_login.value,
            form.dhis2_password.value,
            form.validate_status.value,
            form.continue_on_error.value,
            withExistingDhis2Settings,
        ],
    );

    const onConfirm = useCallback(
        async closeDialog => {
            await submit(closeDialog);
        },
        [submit],
    );

    const onRedirect = useCallback(
        async closeDialog => {
            await submit(closeDialog, true);
        },
        [submit],
    );
    let allowConfirm;
    if (mutation.isLoading) {
        allowConfirm = false;
    } else if (!withExistingDhis2Settings) {
        allowConfirm = !!(
            form.dhis2_url.value &&
            form.dhis2_login.value &&
            form.dhis2_password.value
        );
    } else {
        allowConfirm = true;
    }

    const renderDefaultLayout = showDefaultOverride => {
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
        return <Checkboxes checkboxes={checkboxes} />;
    };

    const renderWithOptionalFields = showDefaultOverride => {
        return (
            <>
                <Grid xs={12} item>
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
                    {renderDefaultLayout(showDefaultOverride)}
                </Grid>
            </>
        );
    };
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
            <Grid container spacing={4} style={{ marginTop: '5px' }}>
                {withExistingDhis2Settings ? (
                    <Grid xs={12} item>
                        {renderDefaultLayout(!isEqual(sourceCredentials, {}))}
                    </Grid>
                ) : (
                    renderWithOptionalFields(!isEqual(sourceCredentials, {}))
                )}
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
AddTask.defaultProps = {
    sourceCredentials: {},
};
AddTask.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
    sourceId: PropTypes.number.isRequired,
    sourceVersion: PropTypes.number.isRequired,
    sourceCredentials: PropTypes.object,
};

export { AddTask };
