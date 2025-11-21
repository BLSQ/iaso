import React, { useContext, FunctionComponent } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { useSidebar } from '../../domains/app/contexts/SideBarContext.js';
import { ThemeConfigContext } from '../../domains/app/contexts/ThemeConfigContext';
import { LangSwitch } from '../../domains/home/components/LangSwitch.js';
import { useFindCustomComponent } from '../../plugins/hooks/customComponents';
import { useCurrentUser } from '../../utils/usersUtils';
import { CurrentUserInfos } from './CurrentUser/index';
import { HomePageButton } from './HomePageButton';
import { LogoutButton } from './LogoutButton';

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

type Props = {
    title?: string;
    children?: React.ReactNode;
    displayBackButton?: boolean;
    goBack?: () => void;
    displayMenuButton?: boolean;
    disableShadow?: boolean;
};

const TopBar: FunctionComponent<Props> = ({
    title = '',
    children,
    displayBackButton = false,
    goBack = () => null,
    displayMenuButton = true,
    disableShadow = false,
}) => {
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
    const Disclaimer = useFindCustomComponent('topbar.disclaimer');
    return (
        <AppBar
            position="relative"
            color="primary"
            id="top-bar"
            sx={{ zIndex: 10 }}
            elevation={disableShadow ? 0 : 4}
        >
            <Toolbar className={classes.root}>
                {Disclaimer && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: theme.spacing(0.25),
                            right: theme.spacing(7),
                        }}
                    >
                        <Disclaimer />
                    </Box>
                )}
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
                        xs={7}
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
                            sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '80%',
                                display: 'block',
                            }}
                        >
                            {title}
                        </Typography>
                    </Grid>
                    {currentUser && !isMobileLayout && (
                        <Grid container item xs={5} justifyContent="flex-end">
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
                                <HomePageButton />
                            </Box>

                            <Box display="flex" justifyContent="center" pl={1}>
                                <LogoutButton />
                            </Box>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                pl={1}
                            >
                                <LangSwitch />
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Toolbar>
            {children}
        </AppBar>
    );
};

export default TopBar;
