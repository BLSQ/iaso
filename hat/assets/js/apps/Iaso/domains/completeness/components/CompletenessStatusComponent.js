import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, withStyles } from '@material-ui/core';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';

const STATUS_COLUMN_ICONS = {
    ready: HourglassEmpty,
    error: ErrorOutline,
    exported: CheckCircleOutline,
};

const styles = () => ({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

function StatusIcon({ status, title, classes }) {
    const IconComponent = STATUS_COLUMN_ICONS[status];

    return (
        <div className={classes.root}>
            <Tooltip title={title}>
                <IconComponent />
            </Tooltip>
        </div>
    );
}
StatusIcon.propTypes = {
    status: PropTypes.oneOf(Object.keys(STATUS_COLUMN_ICONS)).isRequired,
    title: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(StatusIcon);
