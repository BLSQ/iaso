import React, { FunctionComponent, ReactNode } from 'react';
import Box from '@mui/material/Box/Box';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
import { commonStyles } from 'bluesquare-components';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    children?: ReactNode;
};
const Form: FunctionComponent<Props> = ({ children = null }) => {
    const classes = useStyles();

    return (
        <Box
            component="form"
            className={classes.form}
            noValidate
            autoComplete="off"
        >
            {children}
        </Box>
    );
};

export default Form;
