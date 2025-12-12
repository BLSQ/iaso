import React, { FunctionComponent, ReactNode } from 'react';
import { Box } from '@mui/material';
import { useStyles } from '../styles/theme';

type Props = {
    children: ReactNode;
    isModal?: boolean;
};

export const Form: FunctionComponent<Props> = ({
    children,
    isModal = true,
}) => {
    const classes: Record<string, string> = useStyles();
    return (
        <Box
            sx={
                !isModal
                    ? {
                          marginTop: theme => `${theme.spacing(4)} !important`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                      }
                    : {}
            }
            className={isModal ? classes.form : ''}
            component="form"
            noValidate
            autoComplete="off"
        >
            {children}
        </Box>
    );
};
