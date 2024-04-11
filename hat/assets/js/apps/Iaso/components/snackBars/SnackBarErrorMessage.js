import { Button, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';

import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { closeFixedSnackbar } from '../../redux/snackBarsReducer';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    tooltip: {
        marginRight: `${theme.spacing()} !important`,
    },
    textarea: {
        position: 'absolute',
        top: -5000,
        left: -5000,
        zIndex: -100,
    },
    errorMessage: {
        display: 'flex',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
    },
}));

const SnackBarErrorMessage = ({ errorLog, id }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    if (!errorLog || errorLog === '') return null;

    let errorMessage;
    if (typeof errorLog === 'string') {
        errorMessage = errorLog;
    } else if (errorLog.name === 'ApiError' || errorLog.name === 'Error') {
        // Bypass a strange bug in stringify that remove the message from Error
        errorMessage = JSON.stringify(
            { ...errorLog, message: errorLog.message },
            null,
            2,
        );
    } else {
        errorMessage = JSON.stringify(errorLog, null, 1);
    }

    const handleClick = e => {
        navigator.clipboard.writeText(errorMessage);
        e.target.focus();
    };
    const handleClose = () => dispatch(closeFixedSnackbar(id));
    return (
        <>
            <Tooltip
                size="small"
                title={
                    <pre className={classes.errorMessage}>{errorMessage}</pre>
                }
                className={classes.tooltip}
                arrow
            >
                <Button
                    onClick={e => handleClick(e)}
                    size="small"
                    variant="outlined"
                    color="inherit"
                >
                    {formatMessage(MESSAGES.copyError)}
                </Button>
            </Tooltip>
            <Button
                onClick={() => handleClose()}
                size="small"
                variant="outlined"
                color="inherit"
            >
                {formatMessage(MESSAGES.close)}
            </Button>
            <textarea
                onChange={() => null}
                className={classes.textarea}
                value={errorMessage}
            />
        </>
    );
};

SnackBarErrorMessage.defaultProps = {
    errorLog: null,
    id: null,
};
SnackBarErrorMessage.propTypes = {
    errorLog: PropTypes.any,
    id: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default SnackBarErrorMessage;
