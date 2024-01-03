import React from 'react';
import PropTypes from 'prop-types';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Form = ({ children }) => {
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
Form.defaultProps = {
    children: <></>,
};

Form.propTypes = {
    children: PropTypes.node,
};

export default Form;
