import { makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';

export const useInputStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    form: {
        marginTop: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    input: {
        marginBottom: theme.spacing(2),
    },
}));
