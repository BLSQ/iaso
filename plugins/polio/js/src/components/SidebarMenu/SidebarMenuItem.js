import { useState } from 'react';
import { Collapse, makeStyles } from '@material-ui/core';
import {
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@material-ui/core';

import { icons } from '../../constants/icons';
import commonStyles from '../../styles/common';
import { theme as muiTheme } from '../../styles/theme';
import { List } from '@material-ui/core';

import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {useIntl} from "react-intl";

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    listItemIcon: {
        minWidth: 35,
    },
}));

export const MenuItem = ({
    menuItem,
    expanded,
    onExpand,
    subMenuLevel = 0,
}) => {
    const intl = useIntl();
    const classes = useStyles();
    const color = expanded ? 'primary' : 'inherit';
    const subMenuIcon = expanded ? (
        <ExpandLess color={color} />
    ) : (
        <ExpandMore color={color} />
    );

    const itemStyle = {
        paddingLeft: muiTheme.spacing(subMenuLevel * 2),
    };

    return (
        <ListItem
            button
            href={menuItem.path}
            style={itemStyle}
            component={menuItem.path && 'a'}
            onClick={menuItem.subMenu && onExpand}
        >
            <ListItemIcon className={classes.listItemIcon}>
                {icons[menuItem.icon]({ color })}
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography type="body2" color={color}>
                        {intl.formatMessage(menuItem.label)}
                    </Typography>
                }
            />
            {menuItem.subMenu && subMenuIcon}
        </ListItem>
    );
};

export const SidebarMenuItem = ({ menuItem, subMenuLevel = 1 }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <MenuItem
                expanded={expanded}
                menuItem={menuItem}
                subMenuLevel={subMenuLevel}
                onExpand={() => setExpanded(state => !state)}
            />
            {menuItem.subMenu && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {menuItem.subMenu.map(submenu => (
                            <SidebarMenuItem
                                menuItem={submenu}
                                subMenuLevel={subMenuLevel + 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};
