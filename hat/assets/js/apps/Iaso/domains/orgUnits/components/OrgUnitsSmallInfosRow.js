import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, Grid } from '@material-ui/core';

const styles = theme => ({
    label: {
        marginRight: theme.spacing(1),
    },
});
const OrgUnitsSmallInfosRow = ({ label, value, classes }) => (
    <Grid container spacing={0}>
        <Grid
            xs={5}
            item
            container
            justify="flex-end"
            alignContent="flex-start"
        >
            <span className={classes.label}>{`${label} :`}</span>
        </Grid>
        <Grid
            xs={7}
            item
            container
            justify="flex-start"
            alignContent="flex-start"
        >
            {value}
        </Grid>
    </Grid>
);

OrgUnitsSmallInfosRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(OrgUnitsSmallInfosRow);
