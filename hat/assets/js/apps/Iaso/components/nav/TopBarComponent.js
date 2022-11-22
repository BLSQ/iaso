import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';

import {
    IconButton,
    makeStyles,
    Grid,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import MenuIcon from '@material-ui/icons/Menu';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import PropTypes from 'prop-types';

import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';
import { ThemeConfigContext } from '../../domains/app/contexts/ThemeConfigContext.tsx';
import getDisplayName, { useCurrentUser } from '../../utils/usersUtils.ts';

const styles = theme => ({
    menuButton: {
        [theme.breakpoints.up('md')]: {
            marginRight: theme.spacing(2),
            marginLeft: theme.spacing(1),
        },
    },
});

const useStyles = makeStyles(styles);

function TopBar(props) {
    const { title, children, displayBackButton, goBack } = props;
    const classes = useStyles();
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
                <Toolbar>
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
                            {!displayBackButton && (
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
                                alignContent="flex-end"
                                justifyContent="flex-end"
                            >
                                <Typography
                                    variant="body2"
                                    className={classes.userName}
                                    title={getDisplayName(currentUser)}
                                >
                                    {currentUser.user_name}
                                </Typography>
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
};

TopBar.propTypes = {
    title: PropTypes.string,
    children: PropTypes.any,
    displayBackButton: PropTypes.bool,
    goBack: PropTypes.func,
};

export default TopBar;
