import React from 'react';
import PropTypes from 'prop-types';
import OutlinedInput from '@material-ui/core/OutlinedInput';

import {
    injectIntl,
    InputLabel as InputLabelComponent,
    FormControl as FormControlComponent,
} from 'bluesquare-components';
import MESSAGES from '../../domains/forms/messages';

function FileInputComponent({
    intl,
    keyValue,
    label,
    labelString,
    disabled,
    onChange,
    required,
    errors,
}) {
    const labelText =
        labelString !== ''
            ? labelString
            : intl.formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?

    const hasErrors = errors.length > 0;

    return (
        <FormControlComponent errors={errors} withMarginTop>
            <InputLabelComponent
                htmlFor={`input-text-${keyValue}`}
                label={labelText}
                required={required}
                error={hasErrors}
            />
            <OutlinedInput
                size="small"
                disabled={disabled}
                id={`input-text-${keyValue}`}
                type="file"
                error={hasErrors}
                onChange={event => onChange(keyValue, event.target.files[0])}
            />
        </FormControlComponent>
    );
}
FileInputComponent.defaultProps = {
    errors: [],
    label: undefined,
    labelString: '',
    disabled: false,
    required: false,
};
FileInputComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    keyValue: PropTypes.string.isRequired,
    errors: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.object,
    labelString: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    required: PropTypes.bool,
};
export default injectIntl(FileInputComponent);
