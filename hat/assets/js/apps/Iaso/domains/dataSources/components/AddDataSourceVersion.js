import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';

const toggleSaveButton = (values, effect) => {
    if (values.filter(value => !value).length > 0) {
        effect(false);
    } else {
        effect(true);
    }
};

const AddDataSourceVersion = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceVersion,
    defaultSourceVersion,
}) => {
    const [dhisUrl, setDhisUrl] = useState(null);
    const [dhisLogin, setDhisLogin] = useState(null);
    const [dhisPassword, setDhisPassword] = useState(null);
    const [allowConfirm, setAllowConfirm] = useState(false);

    const onConfirm = () => {};

    useEffect(
        // toggleSaveButton([dhisUrl, dhisLogin, dhisPassword], setAllowConfirm),
        () => {
            if (dhisUrl && dhisLogin && dhisPassword) {
                setAllowConfirm(true);
            } else {
                setAllowConfirm(false);
            }
        },
        [dhisUrl, dhisLogin, dhisPassword],
    );

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
            <div>{sourceId}</div>
            <InputComponent
                keyValue="source_name"
                disabled
                value={sourceId}
                type="text"
                clearable={false}
                label={MESSAGES.dataSourceName}
            />
            <InputComponent
                keyValue="source_version"
                disabled
                value={sourceVersion}
                type="text"
                clearable={false}
                label={MESSAGES.yes}
            />
        </ConfirmCancelDialogComponent>
    );
};

AddDataSourceVersion.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
    sourceId: PropTypes.string.isRequired,
    sourceVersion: PropTypes.number.isRequired,
    defaultSourceVersion: PropTypes.object.isRequired,
};
export { AddDataSourceVersion };
