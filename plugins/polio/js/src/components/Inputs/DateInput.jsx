import { TextField } from '@material-ui/core';
import { useInputStyles } from './Styles';

export const DateInput = props => {
    const classes = useInputStyles();

    return (
        <TextField
            className={classes.input}
            displayEmpty
            id="date"
            type="date"
            InputLabelProps={{
                shrink: true,
            }}
            variant={'outlined'}
            size={'medium'}
            {...props}
        />
    );
};
