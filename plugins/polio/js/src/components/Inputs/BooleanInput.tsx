import React, { FunctionComponent } from 'react';
import { Checkbox } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';

type Props = {
    label: string;
    field?: Record<string, any>;
    disabled?: boolean;
    onChange?: (value: boolean) => void;
};

export const BooleanInput: FunctionComponent<Props> = ({
    label,
    onChange,
    field = {},
    disabled = false,
}) => {
    return (
        <FormControlLabel
            id={`check-box-${field.name}`}
            checked={field.value || false}
            onChange={onChange ?? field.onChange}
            name={field.name}
            control={<Checkbox />}
            label={label}
            value={field.value || false}
            disabled={disabled}
        />
    );
};
