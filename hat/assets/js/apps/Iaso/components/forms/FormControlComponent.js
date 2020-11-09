import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, Typography } from '@material-ui/core';
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
    error: {
        color: theme.palette.error.main,
    },
});

function FormControlComponent({ classes, children, withMarginTop, errors }) {
    const classNames = [classes.formControl];
    if (!withMarginTop) {
        classNames.push(classes.formControlWithMarginTop);
    }

    return (
        <FormControl className={classNames.join(' ')} variant="outlined">
            {children}
            {errors.length > 0 &&
                errors.map(error => (
                    <Typography key={error} className={classes.error}>
                        {error}
                    </Typography>
                ))}
        </FormControl>
    );
}
FormControlComponent.defaultProps = {
    withMarginTop: true,
    errors: [],
};
FormControlComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    withMarginTop: PropTypes.bool,
    errors: PropTypes.arrayOf(PropTypes.string.isRequired),
};
export default withStyles(styles)(FormControlComponent);
