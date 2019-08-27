import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { withStyles, IconButton, Tooltip } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import MenuIcon from '@material-ui/icons/Menu';
import ExitIcon from '@material-ui/icons/ExitToApp';

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
        classes, title, toggleSidebar, children,
    } = props;
    return (
        <Fragment>
            <AppBar position="relative" color="primary">
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

                    <Tooltip title={<FormattedMessage id="iaso.logout" defaultMessage="Logout" />}>
                        <IconButton
                            className={classes.button}
                            color="inherit"
                            href="/logout-iaso"
                            aria-label={<FormattedMessage id="iaso.logout" defaultMessage="Logout" />}
                        >
                            <ExitIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                {children}
            </AppBar>
        </Fragment>
    );
}

TopBar.defaultProps = {
    children: null,
};

TopBar.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    children: PropTypes.any,
};

const MapDispatchToProps = dispatch => ({
    toggleSidebar: () => dispatch(toggleSidebarMenu()),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(TopBar),
);
