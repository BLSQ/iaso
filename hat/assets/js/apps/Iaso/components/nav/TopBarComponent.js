import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { withStyles, IconButton } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MenuIcon from '@material-ui/icons/Menu';

import PropTypes from 'prop-types';

import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';

const styles = theme => ({
    button: {
        marginLeft: 'auto',
    },
    menuButton: {
        marginRight: theme.spacing(2),
        marginLeft: -theme.spacing(2),
    },
});

function TopBar(props) {
    const {
        classes, title, toggleSidebar,
    } = props;
    return (
        <Fragment>
            <AppBar position="static" color="default">
                <Toolbar>
                    <IconButton
                        className={classes.menuButton}
                        color="inherit"
                        aria-label="Menu"
                        onClick={toggleSidebar}
                    >
                        <MenuIcon />
                    </IconButton>
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

TopBar.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    toggleSidebar: () => dispatch(toggleSidebarMenu()),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(TopBar),
);
