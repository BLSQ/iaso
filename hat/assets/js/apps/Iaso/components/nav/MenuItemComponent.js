import React, { Fragment } from 'react';
import { injectIntl } from 'react-intl';

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
import commonStyles from '../../styles/common';
import muiTheme from '../../utils/theme';

const styles = theme => ({
    ...commonStyles(theme),
    listItemIcon: {
        minWidth: 35,
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
    } = props;
    const path = `${currentPath}/${menuItem.key}`;
    const baseUrl = location.pathname.split('/')[subMenuLevel];
    const isMenuActive = baseUrl === menuItem.key;
    const [open, setOpen] = React.useState(isMenuActive);
    const toggleOpen = () => {
        setOpen(!open);
    };
    const color = isMenuActive ? 'primary' : 'inherit';
    const hasSubMenu = menuItem.subMenu && menuItem.subMenu.length > 0;
    const subMenuIcon = open ? <ExpandLess color={color} /> : <ExpandMore color={color} />;
    const itemStyle = {
        paddingLeft: muiTheme.spacing(subMenuLevel * 2),
    };
    return (
        <Fragment>
            <ListItem
                style={itemStyle}
                button
                onClick={() => (!hasSubMenu ? onClick(path) : toggleOpen())}
            >
                <ListItemIcon className={classes.listItemIcon}>
                    {menuItem.icon({ color })}
                </ListItemIcon>
                <ListItemText
                    primary={<Typography type="body2" color={color}>{intl.formatMessage(menuItem.label)}</Typography>}
                />
                {
                    hasSubMenu ? subMenuIcon : null
                }
            </ListItem>
            {
                hasSubMenu
                && (
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {
                                menuItem.subMenu.map(subMenu => (
                                    <MenuItem
                                        classes={classes}
                                        intl={intl}
                                        key={subMenu.key}
                                        menuItem={subMenu}
                                        onClick={subPath => onClick(subPath)}
                                        subMenuLevel={subMenuLevel + 1}
                                        location={location}
                                        currentPath={path}
                                    />
                                ))
                            }
                        </List>
                    </Collapse>
                )
            }
        </Fragment>
    );
}

MenuItem.defaultProps = {
    subMenuLevel: 1,
    currentPath: '',
};

MenuItem.propTypes = {
    intl: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    menuItem: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    subMenuLevel: PropTypes.number,
    currentPath: PropTypes.string,
};

export default withStyles(styles)(injectIntl(MenuItem));
