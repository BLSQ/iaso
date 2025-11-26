import React, { FunctionComponent } from 'react';
import {
    FormControlLabel,
    FormControl,
    FormLabel,
    RadioGroup,
    Radio,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
    radioGroup: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 12,
    },
}));

type Props = {
    field?: Record<string, any>;
    form?: Record<string, any>;
    label?: string;
    options?: { label: string; value: unknown }[];
    onChange?: (value: any, form: any) => void;
};
const RadioInput: FunctionComponent<Props> = ({
    field = {},
    form = {},
    label = '',
    options = [],
    onChange = () => {},
}) => {
    const classes = useStyles();
    return (
        <FormControl component="fieldset">
            <FormLabel className={classes.label} component="legend">
                {label}
            </FormLabel>
            <RadioGroup
                classes={{
                    root: classes.radioGroup,
                }}
                name={field.name}
                {...field}
                onChange={e => {
                    if (onChange) {
                        onChange(e.target.value, form);
                    } else {
                        field.onChange(e);
                    }
                }}
                value={field.value !== undefined ? field.value : null}
            >
                {options.map((option: { label: string; value: unknown }) => (
                    <FormControlLabel
                        key={`${option.value}`}
                        value={option.value !== undefined ? option.value : null}
                        control={<Radio />}
                        label={option.label}
                    />
                ))}
            </RadioGroup>
        </FormControl>
    );
};

export default RadioInput;
