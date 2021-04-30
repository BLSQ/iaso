import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Grid } from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { EditableTextFields } from '../../../components/forms/EditableTextFields';
import { Checkboxes } from '../../../components/forms/Checkboxes';
import { redirectTo } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';
import { useDhisOuImporterRequest } from '../requests';
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
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [requestBody, setRequestBody] = useState();
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    // TODO find better name than doesn't overlap with hooks naming conventions
    const [withExistingDhis2Settings, setWithExistingDhis2Settings] = useState(
        !isEqual(sourceCredentials, {}),
    );
    const dispatch = useDispatch();
    // TODO add and return reset function
    const dhisOu = useDhisOuImporterRequest(requestBody);

    const submit = useCallback(() => {
        setAllowConfirm(false);
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
        setRequestBody(body);
    }, [
        sourceId,
        sourceVersion,
        form.dhis2_url.value,
        form.dhis2_login.value,
        form.dhis2_password.value,
        form.validate_status.value,
        form.continue_on_error.value,
        withExistingDhis2Settings,
    ]);

    // TODO check if sourceCredentials doesn't make reset refresh too many times
    const reset = useCallback(() => {
        setRequestBody(null);
        setFormState(initialFormState(sourceCredentials));
    }, [sourceCredentials]);

    const onConfirm = useCallback(
        closeDialog => {
            submit();
            setCloseDialogCallback(() => closeDialog);
        },
        [submit],
    );

    const onRedirect = useCallback(
        closeDialog => {
            onConfirm(closeDialog);
            setRedirect(true);
        },
        [onConfirm],
    );
    useEffect(() => {
        if (!withExistingDhis2Settings) {
            if (
                form.dhis2_url.value &&
                form.dhis2_login.value &&
                form.dhis2_password.value
            ) {
                setAllowConfirm(true);
            } else {
                setAllowConfirm(false);
            }
        } else {
            setAllowConfirm(true);
        }
    }, [
        withExistingDhis2Settings,
        form.dhis2_url.value,
        form.dhis2_login.value,
        form.dhis2_password.value,
        // this dep to unlock buttons after successful request
        // TODO include this behaviour in reset() func
        dhisOu,
    ]);

    useEffect(() => {
        if (dhisOu) {
            closeDialogCallback();
            if (redirect) {
                dispatch(
                    redirectTo(baseUrls.tasks, {
                        order: '-created_at',
                    }),
                );
            }
            reset();
        }
    }, [closeDialogCallback, dhisOu, reset, redirect]);

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
            // eslint-disable-next-line no-unused-vars
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
