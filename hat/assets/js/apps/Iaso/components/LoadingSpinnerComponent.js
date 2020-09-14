import React, { Component } from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import classNames from 'classnames';

const styles = () => ({
    rootFixed: {
        position: 'fixed',
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
    root: {
        position: 'relative',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        zIndex: '1',
    },
    rootTransparent: {
        backgroundColor: 'transparent',
    },
});

class LoadingSpinner extends Component {
    render() {
        const { classes, size, transparent, fixed, padding } = this.props;
        return (
            <div
                style={{
                    padding,
                }}
                className={classNames(
                    fixed && classes.rootFixed,
                    !fixed && classes.root,
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
    fixed: true,
    padding: 0,
};

LoadingSpinner.propTypes = {
    classes: PropTypes.object.isRequired,
    size: PropTypes.number,
    transparent: PropTypes.bool,
    fixed: PropTypes.bool,
    padding: PropTypes.number,
};

export default withStyles(styles)(LoadingSpinner);
