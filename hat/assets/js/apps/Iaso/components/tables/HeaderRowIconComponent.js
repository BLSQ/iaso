import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, withStyles } from '@material-ui/core';

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

function HeaderRowIcon({ IconComponent, title, classes }) {
    return (
        <div className={classes.root}>
            <Tooltip title={title}>
                <IconComponent />
            </Tooltip>
        </div>
    );
}
HeaderRowIcon.propTypes = {
    title: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    IconComponent: PropTypes.object.isRequired,
};

export default withStyles(styles)(HeaderRowIcon);
