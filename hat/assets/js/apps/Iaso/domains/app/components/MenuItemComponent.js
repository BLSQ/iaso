import React from 'react';
import { Link } from 'react-router-dom';

import {
    ListItemIcon,
    ListItem,
    ListItemText,
    Typography,
    Collapse,
    List,
    Box,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import PropTypes from 'prop-types';
import {
    commonStyles,
    theme as muiTheme,
    useSafeIntl,
} from 'bluesquare-components';

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
        subMenuLevel,
        currentPath,
        url,
    } = props;
    const currentUser = useCurrentUser();
    const urlLink = url;
    const { formatMessage } = useSafeIntl();
    const path =
        urlLink || !menuItem.key
            ? `${currentPath}`
            : `${currentPath}/${menuItem.key}`;
    const activePath = location.pathname.split('/', subMenuLevel + 1).join('/');
    const isMenuActive = menuItem.isActive
        ? menuItem.isActive(location.pathname)
        : path === activePath;
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
                    {menuItem.icon && (
                        <ListItemIcon className={classes.listItemIcon}>
                            {menuItem.icon({ color })}
                        </ListItemIcon>
                    )}
                    <ListItemText
                        primary={
                            <Box pl={menuItem.icon ? 0 : 2}>
                                <Typography type="body2" color={color}>
                                    {menuItem.label.defaultMessage &&
                                        menuItem.label.id &&
                                        formatMessage(menuItem.label)}
                                    {typeof menuItem.label === 'string' &&
                                        menuItem.label}
                                </Typography>
                            </Box>
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
                                        key={subMenu.mapKey || subMenu.key}
                                        menuItem={subMenu}
                                        url={subMenu.url}
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
    location: PropTypes.object.isRequired,
    menuItem: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    subMenuLevel: PropTypes.number,
    currentPath: PropTypes.string,
    url: PropTypes.string,
};

export default withStyles(styles)(MenuItem);
