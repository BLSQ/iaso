import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Grid } from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { EditableTextFields } from '../../../components/forms/EditableTextFields';
import { Checkboxes } from '../../../components/forms/Checkboxes';
import { postRequestHandler } from '../../../utils/requests';
import { redirectTo } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

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
 * @param {number} requestBody.source_id
 * @param {number} requestBody.source_version_number
 * @param {string} requestBody.dhis_name
 * @param {string} requestBody.dhis_url
 * @param {string} requestBody.dhis_login
 * @param {string} requestBody.dhis_password
 * @param {boolean} requestBody.force - should be false
 * @param {boolean} requestBody.validate_status
 * @param {boolean} requestBody.continue_on_error
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
    // TODO use useFormState
    const [dhisName, setDhisName] = useState(
        sourceCredentials.name ? sourceCredentials.name : null,
    );
    const [dhisUrl, setDhisUrl] = useState(
        sourceCredentials.url ? sourceCredentials.url : null,
    );
    const [dhisLogin, setDhisLogin] = useState(
        sourceCredentials.login ? sourceCredentials.login : null,
    );
    const [dhisPassword, setDhisPassword] = useState(
        sourceCredentials.password ? sourceCredentials.password : null,
    );
    const [continueOnError, setContinueOnError] = useState(false);
    const [validateStatus, setValidateStatus] = useState(false);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [requestBody, setRequestBody] = useState();
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    // TODO redefine value, find better name than doesn't overlap with hooks naming conventions
    const [withExistingDhis2Settings, setWithExistingDhis2Settings] = useState(
        !isEqual(sourceCredentials, {}),
    );
    const dispatch = useDispatch();
    // TODO add reset function for custom hooks values
    const dhisOu = useSendRequest(requestBody);

    const onConfirm = useCallback(
        closeDialog => {
            setAllowConfirm(false);
            setCloseDialogCallback(() => closeDialog);
            const body = {
                source_id: sourceId,
                source_version_number: sourceVersion,
                force: false,
                validate_status: validateStatus,
                continue_on_error: continueOnError,
            };
            if (!withExistingDhis2Settings) {
                body.dhis2_password = dhisPassword;
                body.dhis2_url = dhisUrl;
                body.dhis2_login = dhisLogin;
            }
            setRequestBody(body);
        },
        [
            sourceId,
            sourceVersion,
            dhisName,
            dhisUrl,
            dhisLogin,
            dhisPassword,
            validateStatus,
            continueOnError,
        ],
    );

    useEffect(() => {
        if (!withExistingDhis2Settings) {
            if (dhisName && dhisUrl && dhisLogin && dhisPassword) {
                setAllowConfirm(true);
            } else {
                setAllowConfirm(false);
            }
        } else {
            setAllowConfirm(true);
        }
    }, [withExistingDhis2Settings, dhisName, dhisUrl, dhisLogin, dhisPassword]);

    // useEffect(() => {
    //     if (dhisOu)
    //         // TODO reset dhisOu and updatedDefaultDataSource values
    //         closeDialogCallback();
    // }, [closeDialogCallback, dhisOu]);
    /**
     *
     * @param {boolean} showDefaultOverride
     */
    const renderDefaultLayout = showDefaultOverride => {
        const checkboxes = [
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
                <Checkboxes checkboxes={checkboxes} />
            </>
        );
    };
    /**
     *
     * @param {boolean} showDefaultOverride
     */
    const renderWithOptionalFields = showDefaultOverride => {
        return (
            <>
                <Grid xs={6} item>
                    <EditableTextFields
                        fields={[
                            {
                                keyValue: 'dhis_name',
                                label: MESSAGES.dhisName,
                                value: dhisName,
                                onChange: (key, value) => {
                                    setDhisName(value);
                                },
                            },
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
            onClosed={() => {}}
            confirmMessage={MESSAGES.launch}
            cancelMessage={MESSAGES.cancel}
            maxWidth="md"
            allowConfirm={allowConfirm}
            additionalButton
            additionalMessage={MESSAGES.add}
            onAdditionalButtonClick={closeDialog => {
                closeDialog();
                dispatch(redirectTo(baseUrls.tasks, {}));
            }}
        >
            <Grid container spacing={4} style={{ marginTop: '5px' }}>
                {withExistingDhis2Settings
                    ? renderDefaultLayout(!isEqual(sourceCredentials, {}))
                    : renderWithOptionalFields(!isEqual(sourceCredentials, {}))}
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
