import React from 'react';
import PropTypes from 'prop-types';
import { Grid, withStyles, Typography } from '@material-ui/core';

import commonStyles from '../../../styles/common';


const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        padding: theme.spacing(2),
    },
    labelContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    label: {
        position: 'relative',
        top: 1,
    },
});


const InstanceDetailsField = ({
    classes, label, value,
}) => (
    <Grid container spacing={1}>
        <Grid xs={5} item>
            <div className={classes.labelContainer}>
                <Typography
                    className={classes.label}
                    variant="body2"
                    noWrap
                    color="inherit"
                    title={label}
                >
                    {label}
                </Typography>
                    :
            </div>
        </Grid>
        <Grid xs={7} container item justify="flex-start" alignItems="center">
            <Typography
                variant="body1"
                noWrap
                color="inherit"
                title={value}
            >
                {value}
            </Typography>
        </Grid>
    </Grid>
);

InstanceDetailsField.propTypes = {
    classes: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
};
export default withStyles(styles)(InstanceDetailsField);
