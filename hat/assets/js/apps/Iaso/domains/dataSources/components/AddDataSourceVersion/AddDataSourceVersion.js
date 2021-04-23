import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import MESSAGES from '../../messages';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { UneditableFields } from './UneditableFields';
import { EditableTextFields } from './EditableTextFields';
import { Checkboxes } from './Checkboxes';

const AddDataSourceVersion = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceVersion,
}) => {
    const [dhisUrl, setDhisUrl] = useState(null);
    const [dhisLogin, setDhisLogin] = useState(null);
    const [dhisPassword, setDhisPassword] = useState(null);
    const [continueOnError, setContinueOnError] = useState(false);
    const [validateStatus, setValidateStatus] = useState(false);
    const [makeDefault, setMakeDefault] = useState(false);
    const [goToPageWhenDone, setGoToPageWhenDone] = useState(false);
    const [allowConfirm, setAllowConfirm] = useState(false);

    const onConfirm = () => {};

    useEffect(() => {
        if (dhisUrl && dhisLogin && dhisPassword) {
            setAllowConfirm(true);
        } else {
            setAllowConfirm(false);
        }
    }, [dhisUrl, dhisLogin, dhisPassword]);

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
    sourceId: PropTypes.string.isRequired,
    sourceVersion: PropTypes.number.isRequired,
};
export { AddDataSourceVersion };
