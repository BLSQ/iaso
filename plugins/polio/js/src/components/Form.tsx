import React, { FunctionComponent, ReactNode } from 'react';
import { Box } from '@mui/material';
import { useStyles } from '../styles/theme';

type Props = {
    children: ReactNode;
};

export const Form: FunctionComponent<Props> = ({ children }) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Box
            component="form"
            className={classes.form} // change alignItems for page
            noValidate
            autoComplete="off"
        >
            {children}
        </Box>
    );
};
