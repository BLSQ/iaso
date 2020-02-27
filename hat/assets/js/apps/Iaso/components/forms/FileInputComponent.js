import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import OutlinedInput from '@material-ui/core/OutlinedInput';

import FormControlComponent from './FormControlComponent';
import InputLabelComponent from './InputLabelComponent';
import MESSAGES from './messages';

function FileInputComponent({
    intl, keyValue, value, label, labelString, disabled, onChange,
}) {
    const labelText = labelString !== ''
        ? labelString
        : intl.formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?

    return (
        <FormControlComponent>
            <InputLabelComponent
                htmlFor={`input-text-${keyValue}`}
                label={labelText}
            />
            <OutlinedInput
                size="small"
                disabled={disabled}
                id={`input-text-${keyValue}`}
                value={value || ''}
                type="file"
                onChange={event => onChange(keyValue, event.target.value)}
            />
        </FormControlComponent>
    );
}
FileInputComponent.defaultProps = {
    value: '',
    label: undefined,
    labelString: '',
    disabled: false,
};
FileInputComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    keyValue: PropTypes.string.isRequired,
    value: PropTypes.string,
    label: PropTypes.object,
    labelString: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};
export default injectIntl(FileInputComponent);
