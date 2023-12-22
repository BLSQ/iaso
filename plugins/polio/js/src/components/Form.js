import React from 'react';
import { Box } from '@mui/material';
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
