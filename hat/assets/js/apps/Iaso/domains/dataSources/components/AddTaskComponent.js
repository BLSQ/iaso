import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Grid } from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { UneditableFields } from '../../../components/forms/UneditableFields';
import { EditableTextFields } from '../../../components/forms/EditableTextFields';
import { Checkboxes } from '../../../components/forms/Checkboxes';
import { postRequestHandler } from '../../../utils/requests';

const sendRequest = (requestBody, dispatch) => {
    if (requestBody)
        return postRequestHandler({
            url: '/api/dhis2ouimporter/',
            body: requestBody,
            errorKeyMessage: 'dhisouimporterError',
            consoleError: 'DHIS OU Importer',
            dispatch,
        });
    return null;
};

/**
 *
 * @param {Object} requestBody - request's body
 * @returns {Object} request's response
 */
const useSendRequest = requestBody => {
    const dispatch = useDispatch();
    const [result, setResult] = useState(null);
    useEffect(() => {
        const executeRequest = async () => {
            const response = await sendRequest(requestBody, dispatch);
            if (response) setResult(response);
        };
        // TODO add error handling
        executeRequest();
    }, [requestBody]);
    return result;
};

const AddTask = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceVersion,
    sourceCredentials,
}) => {
    const [dhisUrl, setDhisUrl] = useState(null);
    const [dhisLogin, setDhisLogin] = useState(null);
    const [dhisPassword, setDhisPassword] = useState(null);
    const [continueOnError, setContinueOnError] = useState(false);
    const [validateStatus, setValidateStatus] = useState(false);
    const [goToPageWhenDone, setGoToPageWhenDone] = useState(false);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [requestBody, setRequestBody] = useState();
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    const [showOptionalFields, setShowOptionalFields] = useState(
        isEqual(sourceCredentials, {}),
    );
    // TODO add reset function for custom hooks values
    const dhisOu = useSendRequest(requestBody);

    const onConfirm = useCallback(
        closeDialog => {
            setAllowConfirm(false);
            setCloseDialogCallback(() => closeDialog);
            setRequestBody({
                source_id: sourceId,
                source_version_number: sourceVersion,
                dhis2_url: dhisUrl,
                dhis2_login: dhisLogin,
                dhis2_password: dhisPassword,
                force: false,
                validate_status: validateStatus,
                continue_on_error: continueOnError,
            });
        },
        [
            sourceId,
            sourceVersion,
            dhisUrl,
            dhisLogin,
            dhisPassword,
            validateStatus,
            continueOnError,
        ],
    );

    useEffect(() => {
        if (dhisUrl && dhisLogin && dhisPassword) {
            setAllowConfirm(true);
        } else {
            setAllowConfirm(false);
        }
    }, [dhisUrl, dhisLogin, dhisPassword]);

    useEffect(() => {
        if (dhisOu)
            // TODO reset dhisOu and updatedDefaultDataSource values
            closeDialogCallback();
    }, [closeDialogCallback, dhisOu]);

    const renderDefaultLayout = () => {
        return (
            <>
                <UneditableFields
                    fields={[
                        {
                            keyValue: 'source_name',
                            value: sourceId,
                            label: MESSAGES.dataSourceName,
                        },
                        {
                            keyValue: 'source_version',
                            value: sourceVersion,
                            label: MESSAGES.dataSourceVersion,
                        },
                    ]}
                />
                <Checkboxes
                    checkboxes={[
                        {
                            keyValue: 'continue_on_error',
                            label: MESSAGES.continueOnError,
                            value: continueOnError,
                            onChange: setContinueOnError,
                        },
                        {
                            keyValue: 'validate_status',
                            label: MESSAGES.validateStatus,
                            value: validateStatus,
                            onChange: setValidateStatus,
                        },
                        {
                            keyValue: 'go_to_current_task',
                            label: MESSAGES.goToCurrentTask,
                            value: goToPageWhenDone,
                            onChange: setGoToPageWhenDone,
                        },
                        {
                            keyValue: 'change_source',
                            label: MESSAGES.edit,
                            value: showOptionalFields,
                            onChange: setShowOptionalFields,
                        },
                    ]}
                />
            </>
        );
    };

    const renderWithOptionalFields = () => {
        return (
            <Grid container>
                <Grid xs={6} item>
                    {renderDefaultLayout()}
                </Grid>
                <Grid xs={6} item>
                    <EditableTextFields
                        fields={[
                            {
                                keyValue: 'dhis_url',
                                label: MESSAGES.dhisUrl,
                                value: dhisUrl,
                                onChange: (key, value) => {
                                    setDhisUrl(value);
                                },
                            },
                            {
                                keyValue: 'dhis_login',
                                label: MESSAGES.dhisLogin,
                                value: dhisLogin,
                                onChange: (key, value) => {
                                    setDhisLogin(value);
                                },
                            },
                            {
                                keyValue: 'dhis_password',
                                label: MESSAGES.dhisPassword,
                                value: dhisPassword,
                                onChange: (key, value) => {
                                    setDhisPassword(value);
                                },
                                password: true,
                            },
                        ]}
                    />
                </Grid>
            </Grid>
        );
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onClosed={() => {}}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            maxWidth="md"
            allowConfirm={allowConfirm}
        >
            <Grid container>
                {showOptionalFields
                    ? renderWithOptionalFields()
                    : renderDefaultLayout()}
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
