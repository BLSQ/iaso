import React, { FunctionComponent } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import {
    useSafeIntl,
    InputLabel as InputLabelComponent,
    FormControl as FormControlComponent,
    IntlMessage,
} from 'bluesquare-components';
import PropTypes from 'prop-types';
import MESSAGES from '../../domains/forms/messages';

type Props = {
    keyValue: string;
    onChange: (keyValue: string, file: any) => void;
    errors?: string[];
    label?: IntlMessage;
    labelString?: string;
    disabled?: boolean;
    required?: boolean;
    multiple?: boolean;
};

const FileInputComponent: FunctionComponent<Props> = ({
    keyValue,
    onChange,
    label,
    labelString = '',
    disabled = false,
    required = false,
    errors = [],
    multiple = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const labelText =
        labelString !== ''
            ? labelString
            : formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?

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
                // size="small"
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
};

export default FileInputComponent;
