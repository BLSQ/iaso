
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const SaveButton = ({
    errorOnSave,
    isDisabled,
    isSaving,
    onSave,
    saveMessage,
}) => (
    <div className="margin-top align-right">
        {
            errorOnSave === true
                && (
                    <div className="error">
                        <FormattedMessage id="main.label.save.error" defaultMessage="Error while saving" />
                    </div>
                )
        }
        {
            errorOnSave === false && errorOnSave !== undefined
                && (
                    <div className="success">
                        <FormattedMessage id="main.label.save.success" defaultMessage="Modification saved" />
                    </div>
                )
        }
        <button
            className="button--save"
            disabled={isDisabled}
            onClick={onSave}
        >
            {
                isSaving ? <i className="fa fa-spinner" /> : <i className="fa fa-save" />
            }
            {saveMessage}
        </button>
    </div>
);

SaveButton.defaultProps = {
    errorOnSave: undefined,
    isSaving: false,
};

SaveButton.propTypes = {
    errorOnSave: PropTypes.any,
    isDisabled: PropTypes.bool.isRequired,
    isSaving: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    saveMessage: PropTypes.string.isRequired,
};

export default SaveButton;
