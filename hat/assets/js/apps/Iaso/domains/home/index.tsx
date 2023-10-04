import React, { FunctionComponent, useCallback, useContext } from 'react';
import {
    Box,
    makeStyles,
    Container,
    Typography,
    Button,
    IconButton,
    Grid,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MenuIcon from '@material-ui/icons/Menu';
import { useDispatch } from 'react-redux';

// @ts-ignore
import iasoBg from '../../images/iaso-bg.png';
import { LogoSvg } from '../app/components/LogoSvg';
import { ThemeConfigContext } from '../app/contexts/ThemeConfigContext';
import { MESSAGES } from './messages';
import { LangSwitch } from './components/LangSwitch';
import { useCurrentUser } from '../../utils/usersUtils';
import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';
import SidebarMenuComponent from '../app/components/SidebarMenuComponent';

const useStyles = makeStyles(theme => ({
    root: {
        backgroundImage: `url("${iasoBg}")`,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center',
        backgroundSize: '100%',
    },
    logo: {
        textAlign: 'center',
        '& svg': { filter: 'drop-shadow(0px 0px 24px rgba(0, 0, 0, 0.24))' },
        '& img': { filter: 'drop-shadow(0px 0px 24px rgba(0, 0, 0, 0.24))' },
    },
    title: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 50,
        textAlign: 'center',
    },
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 25,
        textAlign: 'center',
        textTransform: 'uppercase',
        // @ts-ignore
        color: theme.palette.gray.main,
        width: '50vw',
    },
    login: {
        textAlign: 'center',
        marginTop: theme.spacing(2),
    },
    topMenu: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
}));
const Home: FunctionComponent = () => {
    const classes = useStyles();
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { LOGO_PATH, APP_TITLE } = useContext(ThemeConfigContext);
    // @ts-ignore
    const staticUrl = window.STATIC_URL ?? '/static/';
    const dispatch = useDispatch();
    const toggleSidebar = useCallback(
        () => dispatch(toggleSidebarMenu()),
        [dispatch],
    );
    if (currentUser === null) {
        return null;
    }
    return (
        <Box className={classes.root}>
            <Grid className={classes.topMenu} container spacing={2}>
                <Grid container item xs={6} justifyContent="flex-start">
                    {currentUser && (
                        <Box m={2}>
                            <IconButton
                                color="inherit"
                                aria-label="Menu"
                                onClick={toggleSidebar}
                                id="menu-button"
                            >
                                <MenuIcon />
                            </IconButton>
                            <SidebarMenuComponent location={window.location} />
                        </Box>
                    )}
                </Grid>
                <Grid container item xs={6} justifyContent="flex-end">
                    <Box p={4} display="flex">
                        <LangSwitch />
                    </Box>
                </Grid>
            </Grid>
            <Container maxWidth="md">
                <Box
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                    flexDirection="column"
                    height="100vh"
                >
                    <Box>
                        <Box className={classes.logo}>
                            {APP_TITLE !== 'Iaso' && LOGO_PATH && (
                                <img
                                    alt="logo"
                                    src={`${staticUrl}${LOGO_PATH}`}
                                    style={{ width: 150, height: 'auto' }}
                                />
                            )}
                            {APP_TITLE === 'Iaso' && (
                                <LogoSvg width={150} height={160} />
                            )}
                        </Box>
                        <Typography className={classes.title}>
                            {APP_TITLE}
                        </Typography>
                        <Typography className={classes.text}>
                            {formatMessage(MESSAGES.text)}
                        </Typography>
                        {!currentUser && (
                            <Box className={classes.login}>
                                <Button
                                    color="primary"
                                    href="/login"
                                    variant="contained"
                                >
                                    {formatMessage(MESSAGES.login)}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Home;
