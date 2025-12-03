import React, { FunctionComponent, ReactNode } from 'react';
import { Typography, Box } from '@mui/material';
import FormControlMui from '@mui/material/FormControl';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';

const useStyles = makeStyles(theme => ({
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
}));

type Props = {
    children: ReactNode;
    errors?: string[];
    id?: string;
    hideError?: boolean;
};
export const FormControl: FunctionComponent<Props> = ({
    children,
    errors = [],
    id,
    hideError = false,
}) => {
    const extraProps: any = {};
    const classes: Record<string, string> = useStyles();
    if (id) {
        extraProps.id = id;
    }

    return (
        <FormControlMui
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
        </FormControlMui>
    );
};
