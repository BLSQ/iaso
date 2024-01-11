/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ExitIcon from '@mui/icons-material/ExitToApp';
import {
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    Divider,
    Typography,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { withStyles } from '@mui/styles';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { injectIntl, commonStyles } from 'bluesquare-components';
import { toggleSidebarMenu } from '../../../redux/sidebarMenuReducer';
import { SIDEBAR_WIDTH } from '../../../constants/uiConstants.ts';

import MenuItem from './MenuItemComponent';
import { Logo } from './Logo.tsx';
import LanguageSwitch from './LanguageSwitchComponent';

import { useMenuItems } from '../../../constants/menu.tsx';

import MESSAGES from './messages';

import { getDefaultSourceVersion } from '../../dataSources/utils';
import { useCurrentUser } from '../../../utils/usersUtils.ts';
import { baseUrls } from '../../../constants/urls';

const styles = theme => ({
    ...commonStyles(theme),
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
});

// not removing the function (or the locale argument) because we will want to link to localized version of the doc website
// eslint-disable-next-line no-unused-vars
const localizedManualUrl = locale => {
    return 'https://iaso.readthedocs.io/';
};

const SidebarMenu = ({
    classes,
    isOpen,
    toggleSidebar,
    location,
    intl,
    activeLocale,
}) => {
    const onClick = url => {
        toggleSidebar();
        if (url) {
            window.open(url);
        }
    };
    const currentUser = useCurrentUser();

    const defaultSourceVersion = getDefaultSourceVersion(currentUser);
    const menuItems = useMenuItems();
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Drawer anchor="left" open={isOpen} onClose={toggleSidebar}>
            <div className={classes.toolbar}>
                <Link className={classes.homeLink} to={baseUrls.home}>
                    <Logo />
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
            <List className={classes.list}>
                {menuItems.map(menuItem => (
                    <MenuItem
                        location={location}
                        key={menuItem.key}
                        menuItem={menuItem}
                        onClick={(_, url) => onClick(url)}
                        url={menuItem.url}
                        target="_blank"
                    />
                ))}
            </List>
            <Box className={classes.user}>
                <LanguageSwitch />
                {isMobileLayout && (
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        className={classes.userName}
                    >
                        {currentUser.user_name}
                    </Typography>
                )}

                {currentUser.account && isMobileLayout && (
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        className={classes.userName}
                    >
                        {defaultSourceVersion && (
                            <Tooltip
                                classes={{ popper: classes.popperFixed }}
                                placement="bottom"
                                title={`${intl.formatMessage(
                                    MESSAGES.source,
                                )}: ${
                                    (defaultSourceVersion.source &&
                                        defaultSourceVersion.source.name) ||
                                    '-'
                                }, ${intl.formatMessage(MESSAGES.version)} ${
                                    (defaultSourceVersion.version &&
                                        defaultSourceVersion.version.number) ||
                                    '-'
                                }`}
                            >
                                <span>{currentUser.account.name}</span>
                            </Tooltip>
                        )}
                        {!defaultSourceVersion && (
                            <span>{currentUser.account.name}</span>
                        )}
                    </Typography>
                )}
                <Tooltip
                    classes={{ popper: classes.popperFixed }}
                    placement="bottom-start"
                    title={intl.formatMessage(MESSAGES.viewUserManual)}
                >
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        className={`${classes.userName} ${classes.userManual}`}
                    >
                        <a
                            href={localizedManualUrl(
                                activeLocale.code,
                                currentUser.account,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className={classes.link}
                        >
                            {intl.formatMessage(MESSAGES.userManual)}
                        </a>
                    </Typography>
                </Tooltip>
                <Button
                    size="small"
                    color="inherit"
                    href="/logout-iaso"
                    aria-label={<FormattedMessage {...MESSAGES.logout} />}
                >
                    <ExitIcon className={classes.smallButtonIcon} />
                    <FormattedMessage {...MESSAGES.logout} />
                </Button>
            </Box>
        </Drawer>
    );
};

SidebarMenu.propTypes = {
    classes: PropTypes.object.isRequired,
    isOpen: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    activeLocale: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    isOpen: state.sidebar.isOpen,
    activeLocale: state.app.locale,
});

const MapDispatchToProps = dispatch => ({
    toggleSidebar: () => dispatch(toggleSidebarMenu()),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(SidebarMenu)),
);
