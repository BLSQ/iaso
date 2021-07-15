import React from 'react';
import PropTypes from 'prop-types';
import { Grid, withStyles, Typography } from '@material-ui/core';

import { textPlaceholder, commonStyles } from 'bluesquare-components';

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
        position: 'relative',
        top: 2,
    },
});

const InstanceDetailsField = ({ classes, label, value, Icon, valueTitle }) => (
    <Grid container spacing={1}>
        <Grid xs={5} item>
            <div className={classes.labelContainer}>
                {Icon && <Icon />}
                <Typography
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
        <Grid
            xs={7}
            container
            item
            justifyContent="flex-start"
            alignItems="center"
        >
            <Typography
                variant="body1"
                noWrap
                color="inherit"
                title={valueTitle !== '' ? valueTitle : value}
            >
                {value || textPlaceholder}
            </Typography>
        </Grid>
    </Grid>
);

InstanceDetailsField.defaultProps = {
    Icon: null,
    valueTitle: '',
    value: null,
};

InstanceDetailsField.propTypes = {
    classes: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    Icon: PropTypes.object,
    valueTitle: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};
export default withStyles(styles)(InstanceDetailsField);
