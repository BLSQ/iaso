import React from 'react';
import PropTypes from 'prop-types';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';

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
