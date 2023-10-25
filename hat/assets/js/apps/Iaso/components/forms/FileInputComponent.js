import React from 'react';
import PropTypes from 'prop-types';
import OutlinedInput from '@mui/material/OutlinedInput';

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
    multiple,
}) {
    const labelText =
        labelString !== ''
            ? labelString
            : intl.formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?

    const hasErrors = errors.length > 0;

    return (
        <FormControlComponent errors={errors}>
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
                inputProps={{ multiple }}
                onChange={event => {
                    onChange(
                        keyValue,
                        multiple ? event.target.files : event.target.files[0],
                    );
                }}
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
    multiple: false,
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
    multiple: PropTypes.bool,
};
export default injectIntl(FileInputComponent);
