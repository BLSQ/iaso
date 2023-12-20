import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

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
            justifyContent="flex-end"
            alignContent="flex-start"
        >
            <span className={classes.label}>{`${label} :`}</span>
        </Grid>
        <Grid
            xs={7}
            item
            container
            justifyContent="flex-start"
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
