import React, { FunctionComponent, useContext } from 'react';
import {
    Box,
    makeStyles,
    Container,
    Typography,
    Button,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
// @ts-ignore
import iasoBg from '../../images/iaso-bg.jpg';
import { LogoSvg } from '../app/components/LogoSvg';
import { ThemeConfigContext } from '../app/contexts/ThemeConfigContext';
import { MESSAGES } from './messages';
import { LangSwitch } from './components/LangSwitch';
import { useGetCurrentUser } from './hooks/useGetCurrentUser';
import TopBar from '../../components/nav/TopBarComponent';

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
}));
const Home: FunctionComponent = () => {
    const classes = useStyles();
    const { data: currentUser, isFetching } = useGetCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { LOGO_PATH, APP_TITLE } = useContext(ThemeConfigContext);
    // @ts-ignore
    const staticUrl = window.STATIC_URL ?? '/static/';
    if (isFetching) {
        return null;
    }
    return (
        <Box className={classes.root}>
            <Container maxWidth="md">
                {currentUser && <TopBar title="home" />}
                <Box
                    justifyContent="center"
                    alignItems="center"
                    display="flex"
                    flexDirection="column"
                    height="100vh"
                >
                    <Box>
                        <Box justifyContent="flex-end" display="flex">
                            <LangSwitch />
                        </Box>
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
