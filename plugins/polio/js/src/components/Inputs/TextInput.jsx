import { TextField } from '@material-ui/core';

export const TextInput = props => {
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
        />
    );
};