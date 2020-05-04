
import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Grid,
} from '@material-ui/core';


const styles = theme => ({
    label: {
        marginRight: theme.spacing(1),
    },
});
const OrgUnitsSmallInfosRow = ({
    label, value, classes, isLarge,
}) => (
    <Grid container spacing={0}>
        <Grid
            xs={isLarge ? 5 : 3}
            item
            container
            justify="flex-end"
            alignContent="flex-start"
        >
            <span className={classes.label}>
                {label}
            :
            </span>
        </Grid>
        <Grid
            xs={isLarge ? 7 : 9}
            item
            container
            justify="flex-start"
            alignContent="flex-start"
        >
            {value}
        </Grid>
    </Grid>
);

OrgUnitsSmallInfosRow.defaultProps = {
    isLarge: false,
};

OrgUnitsSmallInfosRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    isLarge: PropTypes.bool,
};


export default withStyles(styles)(OrgUnitsSmallInfosRow);
