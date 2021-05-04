import {
    FormControl,
    InputLabel,
    MenuItem,
    Select as MUISelect,
} from '@material-ui/core';
import get from 'lodash.get';

export const Select = ({ field = {}, form = {}, options = [], ...props }) => {
    return (
        <FormControl
            fullWidth
            variant="outlined"
            {...props}
            error={form.errors && Boolean(get(form.errors, field.name))}
            helperText={form.errors && get(form.errors, field.name)}
        >
            <InputLabel id={`${props.label}-label-id`} shrink>
                {props.label}
            </InputLabel>
            <MUISelect
                labelId={`${props.label}-label-id`}
                id={`${props.label}-field-id`}
                {...field}
                value={field.value ?? ''}
            >
                {options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </MUISelect>
        </FormControl>
    );
};
