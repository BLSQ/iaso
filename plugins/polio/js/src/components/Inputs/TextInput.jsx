import { TextField } from '@material-ui/core';

export const TextInput = ({ field, form, ...props }) => {
    return (
        <TextField
            displayEmpty
            InputLabelProps={{
                shrink: true,
            }}
            fullWidth
            variant={'outlined'}
            size={'medium'}
            {...props}
            {...field}
        />
    );
};
