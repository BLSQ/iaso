import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';


const styles = theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(1),
        marginTop: theme.spacing(1),
        '& fieldset': {
            borderWidth: '1px !important',
        },
        '&:hover fieldset': {
            borderColor: `${theme.palette.primary.main}  !important`,
        },
        '&:focused label': {
            color: `${theme.palette.primary.main}  !important`,
        },
        zIndex: 'auto',
    },
    formControlWithMarginTop: {
        marginTop: theme.spacing(2),
    },
});

function FormControlComponent({ classes, children, withMarginTop }) {
    const classNames = [classes.formControl];
    if (!withMarginTop) {
        classNames.push(classes.formControlWithMarginTop);
    }

    return (
        <FormControl className={classNames.join(' ')} variant="outlined">
            {children}
        </FormControl>
    );
}
FormControlComponent.defaultProps = {
    withMarginTop: true,
};
FormControlComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    withMarginTop: PropTypes.bool,
};
export default withStyles(styles)(FormControlComponent);
