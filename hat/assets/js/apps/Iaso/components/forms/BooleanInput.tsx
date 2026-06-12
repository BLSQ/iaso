import React from 'react';
import {
    Checkbox,
    FormControl,
    FormControlLabelProps,
    FormHelperText,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import { FieldInputProps, FormikProps } from 'formik';

type Props = Omit<
    FormControlLabelProps,
    'label' | 'id' | 'checked' | 'onChange' | 'name' | 'control' | 'value'
> & {
    label: string;
    field: FieldInputProps<boolean>;
    form?: FormikProps<any>;
    onChange?: (
        event: React.SyntheticEvent<Element, Event>,
        checked: boolean,
    ) => void;
};

export const BooleanInput = ({
    label,
    onChange,
    field,
    form,
    ...props
}: Props) => {
    const error = form?.touched?.[field.name] && form?.errors?.[field.name];
    return (
        <FormControl error={!!error}>
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
            {error && <FormHelperText>{error as string}</FormHelperText>}
        </FormControl>
    );
};
