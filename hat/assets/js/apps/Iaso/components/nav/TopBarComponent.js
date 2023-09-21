import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import {
    IconButton,
    makeStyles,
    Grid,
    useMediaQuery,
    useTheme,
    Box,
    Tooltip,
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import MenuIcon from '@material-ui/icons/Menu';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import ExitIcon from '@material-ui/icons/ExitToApp';

import PropTypes from 'prop-types';

import { useSafeIntl } from 'bluesquare-components';
import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';
import { ThemeConfigContext } from '../../domains/app/contexts/ThemeConfigContext.tsx';
import { useCurrentUser } from '../../utils/usersUtils.ts';

import { CurrentUserInfos } from './CurrentUser/index.tsx';
import MESSAGES from './messages';

const styles = theme => ({
    menuButton: {
        [theme.breakpoints.up('md')]: {
            marginRight: theme.spacing(2),
            marginLeft: theme.spacing(1),
        },
    },
    version: {
        fontSize: 9,
        display: 'block',
        marginTop: 5,
    },

    root: {
        '&.MuiToolbar-gutters': {
            paddingRight: '48px',
        },
    },
    logoutButton: {
        padding: theme.spacing(0),
    },
});

const useStyles = makeStyles(styles);

function TopBar(props) {
    const { title, children, displayBackButton, goBack, displayMenuButton } =
        props;
    // const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { APP_TITLE } = useContext(ThemeConfigContext);
    // Set the page title from the top bar title.
    React.useEffect(() => {
        document.title = `${APP_TITLE} ${title ? `| ${title}` : ''}`;
    }, [title, APP_TITLE]);
    const dispatch = useDispatch();
    const toggleSidebar = useCallback(
        () => dispatch(toggleSidebarMenu()),
        [dispatch],
    );

    const currentUser = useCurrentUser();
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <AppBar position="relative" color="primary" id="top-bar">
                <Toolbar className={classes.root}>
                    <Grid
                        container
                        justifyContent="space-between"
                        alignItems="center"
                        direction="row"
                    >
                        <Grid
                            container
                            item
                            direction="row"
                            xs={9}
                            alignItems="center"
                        >
                            {!displayBackButton && displayMenuButton && (
                                <IconButton
                                    className={classes.menuButton}
                                    color="inherit"
                                    aria-label="Menu"
                                    onClick={toggleSidebar}
                                    id="menu-button"
                                >
                                    <MenuIcon />
                                </IconButton>
                            )}
                            {displayBackButton && (
                                <IconButton
                                    className={classes.menuButton}
                                    color="inherit"
                                    aria-label="Back"
                                    onClick={goBack}
                                    id="top-bar-back-button"
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                            )}
                            <Typography
                                variant="h6"
                                color="inherit"
                                id="top-bar-title"
                            >
                                {title}
                            </Typography>
                        </Grid>
                        {currentUser && !isMobileLayout && (
                            <Grid
                                container
                                item
                                xs={3}
                                justifyContent="flex-end"
                            >
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="flex-end"
                                >
                                    <CurrentUserInfos
                                        currentUser={currentUser}
                                        version={window.IASO_VERSION}
                                    />
                                </Box>
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    pl={2}
                                >
                                    <Tooltip
                                        arrow
                                        title={formatMessage(MESSAGES.logout)}
                                    >
                                        <IconButton
                                            className={classes.logoutButton}
                                            color="inherit"
                                            href="/logout-iaso"
                                            id="top-bar-logout-button"
                                        >
                                            <ExitIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Toolbar>
                {children}
            </AppBar>
        </>
    );
}

TopBar.defaultProps = {
    children: null,
    displayBackButton: false,
    goBack: () => null,
    title: '',
    displayMenuButton: true,
};

TopBar.propTypes = {
    title: PropTypes.string,
    children: PropTypes.any,
    displayBackButton: PropTypes.bool,
    goBack: PropTypes.func,
    displayMenuButton: PropTypes.bool,
};

export default TopBar;
