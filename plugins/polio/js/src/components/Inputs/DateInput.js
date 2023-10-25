import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { DatePicker } from 'bluesquare-components';
import { get } from 'lodash';
import { apiDateFormat } from 'Iaso/utils/dates.ts';

import MESSAGES from '../../constants/messages';
import { isTouched } from '../../utils';

export const DateInput = ({
    field,
    form,
    label,
    required,
    disabled,
    onChange = () => {},
    onBlur,
    clearable = true,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && isTouched(form.touched));
    return (
        <Box mb={2}>
            <DatePicker
                label={label}
                required={required}
                disabled={disabled}
                clearMessage={MESSAGES.clear}
                currentDate={field.value || null}
                errors={hasError ? [get(form.errors, field.name)] : []}
                onChange={date => {
                    onChange(field.name, date);
                    form.setFieldTouched(field.name, true);
                    form.setFieldValue(
                        field.name,
                        date ? date.format(apiDateFormat) : null,
                    );
                }}
                onBlur={onBlur}
                clearable={clearable}
            />
        </Box>
    );
};
DateInput.defaultProps = {
    required: false,
    disabled: false,
    onChange: () => {},
    onBlur: undefined,
    clearable: true,
};

DateInput.propTypes = {
    field: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    clearable: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
};
