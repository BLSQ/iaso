import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';


const styles = theme => ({
    inputLabel: {
        color: 'rgba(0, 0, 0, 0.4)',
        paddingLeft: 3,
        paddingRight: 3,
        transition: theme.transitions.create(['all'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    shrink: {
        fontSize: 20,
        marginTop: -2,
        backgroundColor: 'white',
    },
    shrinkFocused: {
        fontSize: 20,
        marginTop: -2,
        backgroundColor: 'white',
        color: theme.palette.primary.main,
    },
});

function InputLabelComponent({
    classes, htmlFor, label, isFocused, shrink,
}) {
    return (
        <InputLabel
            name={htmlFor.replace('input-text-', '')}
            htmlFor={htmlFor}
            classes={{
                shrink: isFocused ? classes.shrinkFocused : classes.shrink,
            }}
            className={classes.inputLabel}
            shrink={shrink}
        >
            { label }
        </InputLabel>
    );
}
InputLabelComponent.defaultProps = {
    isFocused: false,
    shrink: true,
};
InputLabelComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    htmlFor: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isFocused: PropTypes.bool,
    shrink: PropTypes.bool,
};
export default withStyles(styles)(InputLabelComponent);
