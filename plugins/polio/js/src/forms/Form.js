import React from 'react';
import { Box } from '@material-ui/core';
import { useStyles } from '../styles/theme';

export const Form = ({ children }) => {
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
