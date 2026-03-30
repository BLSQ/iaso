import React from 'react';
import { Checkbox, FormControlLabelProps } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';

type Props = Omit<
    FormControlLabelProps,
    'label' | 'id' | 'checked' | 'onChange' | 'name' | 'control' | 'value'
> & {
    label: string;
    field?: Record<string, any>;
    onChange?: (value: boolean) => void;
};

export const BooleanInput = ({
    label,
    onChange,
    field = {},
    ...props
}: Props) => {
    return (
        <FormControlLabel
            id={`check-box-${field.name}`}
            checked={field.value || false}
            onChange={onChange ?? field.onChange}
            name={field.name}
            control={<Checkbox />}
            label={label}
            value={!!field.value}
            {...props}
        />
    );
};
