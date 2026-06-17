import React, { useContext, FunctionComponent } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Box,
    IconButton,
    SxProps,
    Theme,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { CurrentUserInfos } from 'Iaso/components/nav/CurrentUser';
import { DjangoAdminPanelButton } from 'Iaso/components/nav/DjangoAdminPanelButton';
import { HomePageButton } from 'Iaso/components/nav/HomePageButton';
import { LogoutButton } from 'Iaso/components/nav/LogoutButton';
import { NotificationBadge } from 'Iaso/components/nav/NotificationBadge';
import { useSidebar } from 'Iaso/domains/app/contexts/SideBarContext';
import { ThemeConfigContext } from 'Iaso/domains/app/contexts/ThemeConfigContext';
import { LangSwitch } from 'Iaso/domains/home/components/LangSwitch';
import { useFindCustomComponent } from 'Iaso/plugins/hooks/customComponents';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

const styles = (theme: Theme) => ({
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
    sx?: SxProps;
};

const TopBar: FunctionComponent<Props> = ({
    title = '',
    children,
    displayBackButton = false,
    goBack = () => null,
    displayMenuButton = true,
    disableShadow = false,
    sx = {},
}) => {
    const classes = useStyles();

    const { APP_TITLE } = useContext(ThemeConfigContext);
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
            elevation={disableShadow ? 0 : 4}
            sx={{ zIndex: 10, ...sx }}
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
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 0,
                            flex: 1,
                        }}
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
                            id="top-bar-title"
                            sx={{
                                color: 'inherit',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '80%',
                                display: 'block',
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>
                    {currentUser && !isMobileLayout && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                flexShrink: 0,
                                flexWrap: 'nowrap',
                            }}
                        >
                            <NotificationBadge />
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    pl: 1,
                                }}
                            >
                                <CurrentUserInfos
                                    currentUser={currentUser}
                                    version={window.IASO_VERSION ?? ''}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', pl: 2 }}>
                                <HomePageButton />
                            </Box>
                            {currentUser.is_staff === true &&
                                currentUser.is_superuser === true && (
                                    <Box sx={{ display: 'flex', pl: 1 }}>
                                        <DjangoAdminPanelButton />
                                    </Box>
                                )}
                            <Box sx={{ display: 'flex', pl: 1 }}>
                                <LogoutButton />
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    pl: 1,
                                }}
                            >
                                <LangSwitch />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Toolbar>
            {children}
        </AppBar>
    );
};

export default TopBar;
