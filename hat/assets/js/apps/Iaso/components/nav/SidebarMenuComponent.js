import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import { withStyles, IconButton } from '@material-ui/core';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import PropTypes from 'prop-types';

import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';

import logo from '../../images/iaso-dark-logo.svg';

const SIDEBAR_WIDTH = 250;

const styles = theme => ({
    logo: {
        height: '40px',
        width: 'auto',
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    menuButton: {
        marginLeft: 'auto',
    },
    list: {
        width: SIDEBAR_WIDTH,
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
                    <img src={logo} className={classes.logo} alt="logo" />
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
                        <ListItemText primary={formatMessage({
                            defaultMessage: 'Formulaires',
                            id: 'iaso.forms.title',
                        })}
                        />
                    </ListItem>
                    <ListItem button onClick={() => this.onClick('orgunits')}>
                        <ListItemText primary={formatMessage({
                            defaultMessage: 'Org units',
                            id: 'iaso.orgunits.title',
                        })}
                        />
                    </ListItem>
                </List>
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
