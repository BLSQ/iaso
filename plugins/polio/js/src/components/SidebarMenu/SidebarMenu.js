import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ExitIcon from '@material-ui/icons/ExitToApp';

import commonStyles from '../../styles/common';
import { SIDEBAR_WIDTH } from '../../styles/constants';
import { LogoSvg } from '../svg/LogoSvgComponent';
import { makeStyles } from '@material-ui/core';
import { menuItems } from '../../constants/menuItems';
import { SidebarMenuItem } from './SidebarMenuItem';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    listItemIcon: {
        minWidth: 35,
    },
    logo: {
        height: 35,
        width: 90,
    },
    list: {
        width: SIDEBAR_WIDTH,
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        height: 90,
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
}));

export const SidebarMenu = ({ isDrawerOpened, toggleDrawer }) => {
    const classes = useStyles();

    return (
        <Drawer anchor="left" open={isDrawerOpened} onClose={toggleDrawer}>
            <div className={classes.toolbar}>
                <LogoSvg className={classes.logo} />
                <IconButton
                    className={classes.menuButton}
                    color="inherit"
                    aria-label="Menu"
                    onClick={toggleDrawer}
                >
                    <ArrowForwardIcon />
                </IconButton>
            </div>
            <Divider />

            <List className={classes.list}>
                {menuItems.map(menuItem => {
                    return (
                        <SidebarMenuItem
                            menuItem={menuItem}
                            key={menuItem.label}
                        />
                    );
                })}
            </List>

            <Box className={classes.user}>
                <Typography
                    variant="body2"
                    color="textSecondary"
                    className={classes.userName}
                >
                    UserName
                </Typography>
                <Button size="small" color="inherit" href="/logout-iaso">
                    <ExitIcon className={classes.smallButtonIcon} />
                    Logout
                </Button>
            </Box>
        </Drawer>
    );
};
