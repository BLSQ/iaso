import React from 'react';
import { Typography, Box } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import { withStyles } from '@mui/styles';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const styles = theme => ({
    formControl: {
        width: '100%',
        '& fieldset': {
            borderWidth: '1px !important',
        },
        '&:hover fieldset': {
            borderColor: `${theme.palette.primary.main}`,
        },
        '&:focused label': {
            color: `${theme.palette.primary.main}`,
        },
        zIndex: 'auto',
    },
    errorContainer: {
        paddingLeft: theme.spacing(1.6),
        paddingTop: theme.spacing(0.5),
    },
    error: {
        color: theme.palette.error.main,
        fontSize: 14,
        padding: 0,
    },
});

function FormControlComponent({ classes, children, errors, id, hideError }) {
    const extraProps: any = {};
    if (id) {
        extraProps.id = id;
    }

    return (
        <FormControl
            className={classes.formControl}
            variant="outlined"
            {...extraProps}
        >
            {children}
            {errors.length > 0 && !hideError && (
                <Box
                    className={classNames(
                        classes.errorContainer,
                        'error-container',
                    )}
                >
                    {errors
                        .filter(error => !!error)
                        .map(error => (
                            <Typography
                                variant="caption"
                                key={error}
                                className={classes.error}
                            >
                                {error}
                            </Typography>
                        ))}
                </Box>
            )}
        </FormControl>
    );
}
FormControlComponent.defaultProps = {
    errors: [],
    id: null,
    hideError: false,
};
FormControlComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    errors: PropTypes.arrayOf(PropTypes.string.isRequired),
    id: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    hideError: PropTypes.bool,
};
const styledComponent = withStyles(styles)(FormControlComponent);

export { styledComponent as FormControl };
