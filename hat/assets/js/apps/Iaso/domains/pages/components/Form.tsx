import React, { FunctionComponent, ReactNode } from 'react';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';

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
