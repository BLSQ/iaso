import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import ExitIcon from '@material-ui/icons/ExitToApp';
import {
    withStyles,
    Button,
    IconButton,
    Drawer,
    List,
    Divider,
} from '@material-ui/core';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import PropTypes from 'prop-types';

import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';
import { SIDEBAR_WIDTH } from '../../constants/uiConstants';

import MenuItem from './MenuItemComponent';
import LogoSvg from '../svg/LogoSvgComponent';

import commonStyles from '../../styles/common';

import menuItems from '../../constants/menu';

const styles = theme => ({
    ...commonStyles(theme),
    logo: {
        height: 35,
        width: 'auto',
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        height: 90,
    },
    menuButton: {
        marginLeft: 'auto',
    },
    list: {
        width: SIDEBAR_WIDTH,
    },
    logout: {
        marginTop: 'auto',
        marginBottom: theme.spacing(3),
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
    },
});

class SidebarMenu extends PureComponent {
    onClick(path) {
        const {
            redirectTo,
            toggleSidebar,
        } = this.props;
        toggleSidebar();
        redirectTo(path);
    }

    render() {
        const {
            classes,
            isOpen,
            toggleSidebar,
            location,
        } = this.props;
        return (
            <Drawer
                anchor="left"
                open={isOpen}
                onClose={toggleSidebar}
            >
                <div className={classes.toolbar}>
                    <LogoSvg className={classes.logo} />
                    <IconButton
                        className={classes.menuButton}
                        color="inherit"
                        aria-label="Menu"
                        onClick={toggleSidebar}
                    >
                        <ArrowForwardIcon />
                    </IconButton>
                </div>
                <Divider />
                <List className={classes.list}>
                    {
                        menuItems.map(menuItem => (
                            <MenuItem
                                location={location}
                                key={menuItem.key}
                                menuItem={menuItem}
                                onClick={path => this.onClick(path)}
                            />
                        ))
                    }
                </List>
                <Button
                    size="small"
                    className={classes.logout}
                    color="inherit"
                    href="/logout-iaso"
                    aria-label={<FormattedMessage id="iaso.logout" defaultMessage="Logout" />}
                >
                    <ExitIcon className={classes.smallButtonIcon} />
                    <FormattedMessage id="iaso.logout" defaultMessage="Logout" />
                </Button>
            </Drawer>
        );
    }
}

SidebarMenu.propTypes = {
    classes: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    isOpen: state.sidebar.isOpen,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: key => dispatch(push(key)),
    toggleSidebar: () => dispatch(toggleSidebarMenu()),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(SidebarMenu),
);
