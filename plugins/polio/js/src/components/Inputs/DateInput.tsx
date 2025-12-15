import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { DatePicker } from 'bluesquare-components';
import { get } from 'lodash';
import { apiDateFormat } from 'Iaso/utils/dates';

import MESSAGES from '../../constants/messages';

type Props = {
    field: Record<string, any>;
    form: Record<string, any>;
    label: string;
    required?: boolean;
    disabled?: boolean;
    clearable?: boolean;
    onChange?: (fieldName: string, date: Date) => void;
    onBlur?: () => void;
};

export const DateInput: FunctionComponent<Props> = ({
    field,
    form,
    label,
    required = false,
    disabled = false,
    onChange = () => {},
    onBlur = () => {},
    clearable = true,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));
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
                onBlur={onBlur} // TODO fix typing in bluesquare-components
                clearable={clearable}
            />
        </Box>
    );
};
