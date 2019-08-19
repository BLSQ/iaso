import React, { Component } from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import classNames from 'classnames';

const styles = () => ({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        zIndex: '10000',
    },
    rootTransparent: {
        backgroundColor: 'transparent',
    },
});

class LoadingSpinner extends Component {
    render() {
        const { classes, size, transparent } = this.props;
        return (
            <div
                className={classNames(
                    classes.root,
                    transparent && classes.rootTransparent,
                )}
            >
                <CircularProgress size={size} />
            </div>
        );
    }
}
LoadingSpinner.defaultProps = {
    size: 40,
    transparent: false,
};

LoadingSpinner.propTypes = {
    classes: PropTypes.object.isRequired,
    size: PropTypes.number,
    transparent: PropTypes.bool,
};

export default withStyles(styles)(LoadingSpinner);
