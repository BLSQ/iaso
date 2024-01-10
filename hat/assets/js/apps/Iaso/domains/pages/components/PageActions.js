import React from 'react';
import PropTypes from 'prop-types';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Grid } from '@mui/material';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const PageActions = ({ children }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={4}
            justifyContent="flex-end"
            alignItems="center"
        >
            <Grid
                item
                xs={4}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                {children}
            </Grid>
        </Grid>
    );
};

PageActions.defaultProps = {
    children: <></>,
};

PageActions.propTypes = {
    children: PropTypes.node,
};

export default PageActions;
