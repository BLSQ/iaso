import React from 'react';
import { Button } from '@material-ui/core';
import { useStyles } from '../../styles/theme';

export const PageAction = ({ icon: Icon, onClick, children }) => {
    const classes = useStyles();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            className={classes.pageAction}
        >
            <Icon className={classes.buttonIcon} />
            {children}
        </Button>
    );
};
