import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import MESSAGES from '../../messages';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { UneditableFields } from './UneditableFields';
import { EditableTextFields } from './EditableTextFields';
import { Checkboxes } from './Checkboxes';
import {
    postRequestHandler,
    putRequestHandler,
} from '../../../../utils/requests';
// TODO discuss way to remove dispatch prop drilling
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

const useSendRequest = (requestBody, dispatch) => {
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

const updateDefault = (accountId, requestBody, dispatch) => {
    if (requestBody) {
        return putRequestHandler({
            url: `/api/accounts/${accountId}/`,
            body: requestBody,
            errorKeyMessage: 'updateDefaultSourceError',
            consoleError: 'Update Default Source Data',
            dispatch,
        });
    }
    return null;
};

const useUpdateDefaultDataSource = (parameters, triggers) => {
    const [result, setResult] = useState(null);
    useEffect(() => {
        let shouldTrigger = true;
        triggers.forEach(trigger => {
            if (!trigger) shouldTrigger = false;
        });
        const executeDefaultUpdate = async () => {
            if (shouldTrigger) {
                // TODO find correct value for new default version id
                const body = { default_version: parameters.sourceVersion };
                const updatedDefault = await updateDefault(
                    parameters.accountId,
                    body,
                    parameters.dispatch,
                );
                setResult(updatedDefault);
                // TODO add error handling
            }
        };
        executeDefaultUpdate();
    }, [...triggers]);
    return result;
};

const AddDataSourceVersion = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceVersion,
    dispatch,
    // defaultSourceVersion,
}) => {
    const [dhisUrl, setDhisUrl] = useState(null);
    const [dhisLogin, setDhisLogin] = useState(null);
    const [dhisPassword, setDhisPassword] = useState(null);
    const [continueOnError, setContinueOnError] = useState(false);
    const [validateStatus, setValidateStatus] = useState(false);
    const [makeDefault, setMakeDefault] = useState(false);
    const [goToPageWhenDone, setGoToPageWhenDone] = useState(false);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [requestBody, setRequestBody] = useState();
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    const accountId = useSelector(state => state.users.current.account.id);
    // TODO add reset function for custom hooks values
    const dhisOu = useSendRequest(requestBody);
    const updatedDefaultDataSource = useUpdateDefaultDataSource(
        { accountId, sourceVersion, dispatch },
        [dhisOu, makeDefault],
    );

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
        if (
            (dhisOu && !makeDefault) ||
            (makeDefault && updatedDefaultDataSource)
        )
            // TODO reset dhisOu and updatedDefaultDataSource values
            closeDialogCallback();
    }, [closeDialogCallback, dhisOu, updatedDefaultDataSource]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onClosed={() => {}}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
        >
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
            <EditableTextFields
                fields={[
                    {
                        keyValue: 'dhis_url',
                        label: MESSAGES.dhisUrl,
                        value: dhisUrl,
                        onChange: setDhisUrl,
                    },
                    {
                        keyValue: 'dhis_login',
                        label: MESSAGES.dhisLogin,
                        value: dhisLogin,
                        onChange: setDhisLogin,
                    },
                    {
                        keyValue: 'dhis_password',
                        label: MESSAGES.dhisPassword,
                        value: dhisPassword,
                        onChange: setDhisPassword,
                        password: true,
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
                        keyValue: 'make_default',
                        label: MESSAGES.makeDefaultSource,
                        value: makeDefault,
                        onChange: setMakeDefault,
                    },
                    {
                        keyValue: 'go_to_current_task',
                        label: MESSAGES.goToCurrentTask,
                        value: goToPageWhenDone,
                        onChange: setGoToPageWhenDone,
                    },
                ]}
            />
        </ConfirmCancelDialogComponent>
    );
};

AddDataSourceVersion.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
    sourceId: PropTypes.number.isRequired,
    sourceVersion: PropTypes.number.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = _ => {
    return {};
};

const mapDispatchToProps = dispatch => ({ dispatch });

const addDataSourceVersion = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AddDataSourceVersion);

export { addDataSourceVersion as AddDataSourceVersion };
