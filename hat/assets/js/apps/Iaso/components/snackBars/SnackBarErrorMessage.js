import React from 'react';
import { Button, Tooltip, makeStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import MESSAGES from './messages';
import commonStyles from '../../styles/common';
import { closeFixedSnackbar } from '../../redux/snackBarsReducer';
import injectIntl from '../../libs/intl/injectIntl';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    tooltip: {
        marginRight: theme.spacing(),
    },
    textarea: {
        position: 'absolute',
        top: -5000,
        left: -5000,
        zIndex: -100,
    },
    errorMessage: {
        display: '-webkit-box',
        '-webkit-line-clamp': 30,
        '-webkit-box-orient': 'vertical',
        overflow: 'hidden',
    },
}));

const SnackBarErrorMessage = ({ errorLog, id, intl: { formatMessage } }) => {
    if (!errorLog || errorLog === '') return null;
    const classes = useStyles();
    const errorMessage =
        typeof errorLog === 'string' ? errorLog : JSON.stringify(errorLog);
    const dispatch = useDispatch();
    const handleClick = e => {
        navigator.clipboard.writeText(errorMessage);
        e.target.focus();
    };
    const handleClose = () => dispatch(closeFixedSnackbar(id));
    return (
        <>
            <Tooltip
                size="small"
                title={<p className={classes.errorMessage}>{errorMessage}</p>}
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
    intl: PropTypes.object.isRequired,
};

export default injectIntl(SnackBarErrorMessage);
