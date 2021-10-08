import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { useStyles } from '../../styles/theme';
import { Filters } from '../campaignCalendar/Filters';

export const PageActions = ({ children, params }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={2}
            justifyContent="flex-end"
            alignItems="center"
        >
            <Grid item xs={12}>
                <Filters params={params} baseUrl="polio/list" />
            </Grid>
            <Grid
                item
                xs={12}
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
    children: null,
};

PageActions.propTypes = {
    params: PropTypes.object.isRequired,
    children: PropTypes.any,
};
