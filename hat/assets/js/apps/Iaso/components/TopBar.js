import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import { withStyles, IconButton } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import PropTypes from 'prop-types';

const styles = theme => ({
    button: {
        marginLeft: 'auto',
    },
    backButton: {
        marginRight: theme.spacing(2),
    },
});

function TopBar(props) {
    const {
        classes, title, showGoBack, goBack,
    } = props;
    return (
        <Fragment>
            <AppBar position="static" color="default">
                <Toolbar>
                    {
                        showGoBack && (
                            <IconButton
                                className={classes.backButton}
                                color="inherit"
                                aria-label="Back"
                                onClick={goBack}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                    <Typography variant="h6" color="inherit">
                        {title}
                    </Typography>

                    <Button variant="contained" href="/logout-iaso" className={classes.button} color="primary">
                        <FormattedMessage id="iaso.logout" defaultMessage="Se déconnecter" />
                    </Button>
                </Toolbar>
            </AppBar>
        </Fragment>
    );
}

TopBar.defaultProps = {
    goBack: () => { },
    showGoBack: false,
};

TopBar.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    goBack: PropTypes.func,
    showGoBack: PropTypes.bool,
};

export default withStyles(styles)(TopBar);
