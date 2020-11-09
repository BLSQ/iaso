import React from 'react';

import { withStyles } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Warning from '@material-ui/icons/Warning';

import PropTypes from 'prop-types';
import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    root: {
        backgroundColor: theme.palette.error.background,
        padding: theme.spacing(3, 2),
    },
    paragraph: {
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.error.main,
        justifyContent: 'center',
    },
    buttonIcon: {
        ...commonStyles(theme).buttonIcon,
        width: 35,
        height: 35,
    },
});

function ErrorPaperComponent(props) {
    const { classes, message } = props;
    return (
        <Paper className={classes.root}>
            <Typography component="p" className={classes.paragraph}>
                <Warning className={classes.buttonIcon} />
                {message}
            </Typography>
        </Paper>
    );
}
ErrorPaperComponent.defaultProps = {
    message: '',
};

ErrorPaperComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    message: PropTypes.string,
};

export default withStyles(styles)(ErrorPaperComponent);
