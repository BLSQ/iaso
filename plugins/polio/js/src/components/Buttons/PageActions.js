import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { useStyles } from '../../styles/theme';
import { Filters } from '../../domains/Calendar/campaignCalendar/Filters';
import { DASHBOARD_BASE_URL } from '../../constants/routes';

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
                <Filters
                    params={params}
                    baseUrl={DASHBOARD_BASE_URL}
                    showTest
                />
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
