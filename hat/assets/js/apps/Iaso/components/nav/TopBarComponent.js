import { Box, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import React, { useContext } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';

import PropTypes from 'prop-types';

import { ThemeConfigContext } from '../../domains/app/contexts/ThemeConfigContext.tsx';
import { useCurrentUser } from '../../utils/usersUtils.ts';

import { useSidebar } from '../../domains/app/contexts/SideBarContext.tsx';
import { AccountSwitch } from './AccountSwitch.tsx';
import { CurrentUserInfos } from './CurrentUser/index.tsx';
import { LogoutButton } from './LogoutButton.tsx';
import { HomePageButton } from './HomePageButton.tsx';

const styles = theme => ({
    menuButton: {
        [theme.breakpoints.up('md')]: {
            marginRight: `${theme.spacing(2)} !important`,
            marginLeft: `${theme.spacing(1)} !important`,
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
    const classes = useStyles();

    const { APP_TITLE } = useContext(ThemeConfigContext);
    // Set the page title from the top bar title.
    React.useEffect(() => {
        document.title = `${APP_TITLE} ${title ? `| ${title}` : ''}`;
    }, [title, APP_TITLE]);
    const { toggleSidebar } = useSidebar();

    const currentUser = useCurrentUser();
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AppBar
            position="relative"
            color="primary"
            id="top-bar"
            sx={{ zIndex: 10 }}
        >
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
                        <Grid container item xs={3} justifyContent="flex-end">
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

                            <Box display="flex" justifyContent="center" pl={2}>
                                <AccountSwitch />
                            </Box>

                            <Box display="flex" justifyContent="center" pl={2}>
                                <HomePageButton />
                            </Box>

                            <Box display="flex" justifyContent="center" pl={1}>
                                <LogoutButton />
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Toolbar>
            {children}
        </AppBar>
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
