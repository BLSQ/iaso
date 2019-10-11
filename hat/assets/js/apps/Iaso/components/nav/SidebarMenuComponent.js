import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import ExitIcon from '@material-ui/icons/ExitToApp';
import {
    withStyles,
    Button,
    IconButton,
    ListItemIcon,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Divider,
    Tooltip,
} from '@material-ui/core';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';

import PropTypes from 'prop-types';

import logoUrl from '../../images/iaso-logo.svg';
import orgUnitIconUrl from '../../images/grey-pentagon.svg';

import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';
import SIDEBAR_WIDTH from '../../constants/uiConstants';

import commonStyles from '../../styles/common';

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
    listItemIcon: {
        minWidth: 35,
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
            intl: {
                formatMessage,
            },
            isOpen,
            toggleSidebar,
        } = this.props;
        return (
            <Drawer
                anchor="left"
                open={isOpen}
                onClose={toggleSidebar}
            >
                <div className={classes.toolbar}>
                    <img src={logoUrl} className={classes.logo} alt="logo" />
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
                    <ListItem button onClick={() => this.onClick('forms')}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <DataSourceIcon />
                        </ListItemIcon>
                        <ListItemText primary={formatMessage({
                            defaultMessage: 'Forms',
                            id: 'iaso.forms.title',
                        })}
                        />
                    </ListItem>
                    <ListItem button onClick={() => this.onClick('orgunits')}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <img src={orgUnitIconUrl} className={classes.svgIcon} alt="org unit" />
                        </ListItemIcon>
                        <ListItemText primary={formatMessage({
                            defaultMessage: 'Org units',
                            id: 'iaso.orgUnits.title',
                        })}
                        />
                    </ListItem>
                </List>
                <Tooltip title={<FormattedMessage id="iaso.logout" defaultMessage="Logout" />} >
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
                </Tooltip>
            </Drawer>
        );
    }
}

SidebarMenu.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    isOpen: state.sidebar.isOpen,
});

const MapDispatchToProps = dispatch => ({
    redirectTo: key => dispatch(push(key)),
    toggleSidebar: () => dispatch(toggleSidebarMenu()),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(SidebarMenu)),
);
