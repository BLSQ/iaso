import React, { Fragment } from 'react';
import { Link } from 'react-router';

import {
    withStyles,
    ListItemIcon,
    ListItem,
    ListItemText,
    Typography,
    Collapse,
    List,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

import PropTypes from 'prop-types';
import {
    injectIntl,
    commonStyles,
    theme as muiTheme,
} from 'bluesquare-components';
// TODO check  that updated import of theme is equivalent
// import muiTheme from '../../../utils/theme';

import { listMenuPermission, userHasOneOfPermissions } from '../../users/utils';
import { useCurrentUser } from '../../../utils/usersUtils.ts';

const styles = theme => ({
    ...commonStyles(theme),
    listItemIcon: {
        minWidth: 35,
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
    },
});

function MenuItem(props) {
    const {
        onClick,
        menuItem,
        location,
        classes,
        intl,
        subMenuLevel,
        currentPath,
        url,
    } = props;

    const currentUser = useCurrentUser();
    const urlLink = url;
    const path = urlLink ? `${currentPath}` : `${currentPath}/${menuItem.key}`;
    const activePath = location.pathname.split('/', subMenuLevel + 1).join('/');
    const isMenuActive = path === activePath;
    const fullPath = `${
        menuItem.extraPath
            ? `${path}/accountId/${currentUser.account.id}${menuItem.extraPath}`
            : path
    }`;
    const [open, setOpen] = React.useState(isMenuActive);
    const toggleOpen = () => {
        setOpen(!open);
    };
    const color = isMenuActive ? 'primary' : 'inherit';
    const hasSubMenu = menuItem.subMenu && menuItem.subMenu.length > 0;
    const subMenuIcon = open ? (
        <ExpandLess color={color} />
    ) : (
        <ExpandMore color={color} />
    );
    const itemStyle = {
        paddingLeft: muiTheme.spacing(subMenuLevel * 2),
    };
    return (
        <>
            <Link
                className={classes.linkButton}
                to={!hasSubMenu ? fullPath : ''}
                target={urlLink ? '_blank' : ''}
            >
                <ListItem
                    style={itemStyle}
                    button
                    onClick={() =>
                        !hasSubMenu ? onClick(path, url) : toggleOpen()
                    }
                >
                    <ListItemIcon className={classes.listItemIcon}>
                        {menuItem.icon({ color })}
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography type="body2" color={color}>
                                {intl.formatMessage(menuItem.label)}
                            </Typography>
                        }
                    />
                    {hasSubMenu ? subMenuIcon : null}
                </ListItem>
            </Link>
            {hasSubMenu && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {menuItem.subMenu.map(subMenu => {
                            const permissionsList = listMenuPermission(subMenu);
                            if (
                                userHasOneOfPermissions(
                                    permissionsList,
                                    currentUser,
                                )
                            ) {
                                return (
                                    <MenuItem
                                        classes={classes}
                                        intl={intl}
                                        key={subMenu.key}
                                        menuItem={subMenu}
                                        onClick={subPath => onClick(subPath)}
                                        subMenuLevel={subMenuLevel + 1}
                                        location={location}
                                        currentPath={path}
                                        currentUser={currentUser}
                                    />
                                );
                            }
                            return null;
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
}

MenuItem.defaultProps = {
    subMenuLevel: 1,
    currentPath: '',
    url: '',
};

MenuItem.propTypes = {
    intl: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    menuItem: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    subMenuLevel: PropTypes.number,
    currentPath: PropTypes.string,
    currentUser: PropTypes.object.isRequired,
    url: PropTypes.string,
};

export default withStyles(styles)(injectIntl(MenuItem));
