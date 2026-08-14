import React, { FunctionComponent } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { useMenuItems } from '../../../constants/menu';
import { SIDEBAR_WIDTH } from '../../../constants/uiConstants';
import { baseUrls } from '../../../constants/urls';
import { useSidebar } from '../contexts/SideBarContext';
import { LogoAndTitle } from './LogoAndTitle';
import MenuItem from './MenuItemComponent';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        height: 90,
    },
    menuButton: {
        marginLeft: 'auto',
    },
    list: {
        width: SIDEBAR_WIDTH,
        '& a': {
            textDecoration: 'none !important',
        },
    },
    user: {
        marginTop: 'auto',
        marginBottom: theme.spacing(3),
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
    },
    userName: {
        margin: theme.spacing(1),
    },
    userManual: {
        cursor: 'pointer',
    },
    link: {
        textDecoration: 'none !important',
        color: 'inherit',
    },
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontWeight: '700',
        fontSize: 23,
        marginLeft: theme.spacing(2),
    },
    homeLink: {
        textDecoration: 'none !important',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
    },
    bottomLinkItem: {
        color: 'inherit',
    },
    drawerContent: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    mainContent: {
        flex: 1,
    },
}));

type Props = { location: any };

const SidebarMenu: FunctionComponent<Props> = ({ location }) => {
    const classes: Record<string, string> = useStyles();
    const { toggleSidebar, isOpen } = useSidebar();
    const onClick = (url?: string) => {
        toggleSidebar();
        if (url) {
            window.open(url);
        }
    };
    const currentAccount = useCurrentAccount();
    const { formatMessage } = useSafeIntl();
    const menuItems = useMenuItems();
    const userGuideUrl = currentAccount?.user_manual_path;
    const forumGuideUrl = currentAccount?.forum_path;

    return (
        <Drawer anchor="left" open={isOpen} onClose={toggleSidebar}>
            <div className={classes.drawerContent}>
                <div className={classes.toolbar}>
                    <Link className={classes.homeLink} to={`/${baseUrls.home}`}>
                        <LogoAndTitle />
                    </Link>
                    <IconButton
                        className={classes.menuButton}
                        color="inherit"
                        aria-label="Menu"
                        onClick={toggleSidebar}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </div>
                <Divider />
                <List className={`${classes.list} ${classes.mainContent}`}>
                    {menuItems.map(menuItem => (
                        <MenuItem
                            location={location}
                            key={menuItem.key}
                            menuItem={menuItem}
                            onClick={(_, url) => onClick(url)}
                            url={menuItem.url}
                        />
                    ))}
                </List>
                <List className={`${classes.list} ${classes.user}`}>
                    {userGuideUrl && (
                        <Tooltip
                            classes={{ popper: classes.popperFixed }}
                            placement="top-start"
                            title={formatMessage(MESSAGES.viewUserManual)}
                        >
                            <ListItem
                                className={classes.bottomLinkItem}
                                button
                                component="a"
                                href={userGuideUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ListItemIcon>
                                    <MenuBookIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            <FormattedMessage
                                                {...MESSAGES.userManual}
                                            />
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        </Tooltip>
                    )}
                    {forumGuideUrl && (
                        <Tooltip
                            classes={{ popper: classes.popperFixed }}
                            placement="top-start"
                            title={formatMessage(MESSAGES.viewForum)}
                        >
                            <ListItem
                                className={classes.bottomLinkItem}
                                button
                                component="a"
                                href={forumGuideUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ListItemIcon>
                                    <ChatIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            <FormattedMessage
                                                {...MESSAGES.forum}
                                            />
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        </Tooltip>
                    )}
                </List>
            </div>
        </Drawer>
    );
};

export default SidebarMenu;
