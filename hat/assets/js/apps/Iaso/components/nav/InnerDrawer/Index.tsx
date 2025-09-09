import React, { FunctionComponent, ReactNode, useState } from 'react';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { innerDrawerStyles, menuHeight } from './styles';

const useStyles = makeStyles(theme => {
    return {
        ...innerDrawerStyles(theme),
        ...commonStyles(theme),
        boxContent: {
            width: '100%',
        },
        button: {
            width: '100%',
            marginBottom: theme.spacing(2),
        },
        mapContainer: {
            ...commonStyles(theme).mapContainer,
            marginBottom: 0,
            height: `calc(100vh - ${menuHeight}px)`,
            overflow: 'hidden',
            position: 'relative',
        },
        innerDrawerTab: {
            ...commonStyles(theme).innerDrawerTab,
            minWidth: 60,
            fontSize: 12,
            paddingRight: theme.spacing(1),
            paddingLeft: theme.spacing(1),
        },
        hiddenOpacity: {
            position: 'absolute',
            top: 0,
            left: -5000,
            zIndex: -10,
            opacity: 0,
        },
    };
});

type Props = {
    children?: ReactNode;
    editOptionComponent?: any;
    settingsOptionComponent?: any;
    filtersOptionComponent?: any;
    commentsOptionComponent?: any;
    settingsDisabled?: boolean;
    filtersDisabled?: boolean;
    withTopBorder?: boolean;
    footerComponent?: any;
    commentsDisabled?: boolean;
    defaultActiveOption?: 'settings' | 'filters' | 'edit' | 'comments';
    setCurrentOption?: (
        option: 'settings' | 'filters' | 'edit' | 'comments',
    ) => void;
};

export const InnerDrawer: FunctionComponent<Props> = ({
    editOptionComponent = null,
    settingsOptionComponent = null,
    filtersOptionComponent = null,
    commentsOptionComponent = null,
    footerComponent = null,
    settingsDisabled = false,
    filtersDisabled = false,
    withTopBorder = false,
    commentsDisabled = false,
    defaultActiveOption = 'settings',
    setCurrentOption = _option => null,
    children = null,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [activeOption, setActiveOption] = useState<
        'settings' | 'filters' | 'edit' | 'comments'
    >(defaultActiveOption);

    const toggleOption = newActiveOption => {
        setActiveOption(newActiveOption);
        setCurrentOption(newActiveOption);
    };

    return (
        <Box
            borderTop={withTopBorder ? 1 : 0}
            borderColor="grey.300"
            p={0}
            className={classes.boxContent}
            component="div"
        >
            <Grid container spacing={0}>
                <Grid
                    item
                    xs={7}
                    md={8}
                    lg={9}
                    className={classes.mapContainer}
                >
                    {children}
                </Grid>
                <Grid
                    item
                    xs={5}
                    md={4}
                    lg={3}
                    className={classes.innerDrawerToolContainer}
                >
                    <Box width="100%">
                        {(filtersOptionComponent ||
                            editOptionComponent ||
                            commentsOptionComponent) && (
                            <Tabs
                                classes={{
                                    root: classes.innerDrawerTabs,
                                }}
                                value={activeOption}
                                indicatorColor="primary"
                                onChange={(event, newtab) =>
                                    toggleOption(newtab)
                                }
                            >
                                {filtersOptionComponent && (
                                    <Tab
                                        classes={{
                                            root: classes.innerDrawerTab,
                                        }}
                                        disabled={filtersDisabled}
                                        value="filters"
                                        label={formatMessage(MESSAGES.filters)}
                                    />
                                )}
                                {editOptionComponent && (
                                    <Tab
                                        classes={{
                                            root: classes.innerDrawerTab,
                                        }}
                                        value="edit"
                                        label={formatMessage(MESSAGES.edit)}
                                    />
                                )}
                                {settingsOptionComponent && (
                                    <Tab
                                        classes={{
                                            root: classes.innerDrawerTab,
                                        }}
                                        disabled={settingsDisabled}
                                        value="settings"
                                        label={formatMessage(MESSAGES.settings)}
                                    />
                                )}
                                {commentsOptionComponent && (
                                    <Tab
                                        classes={{
                                            root: classes.innerDrawerTab,
                                        }}
                                        value="comments"
                                        disabled={commentsDisabled}
                                        label={formatMessage(MESSAGES.comments)}
                                    />
                                )}
                            </Tabs>
                        )}
                        <Box
                            display="flex"
                            flexWrap="wrap"
                            className={classes.innerDrawerContentContainer}
                            flexDirection="row"
                        >
                            {filtersOptionComponent && (
                                <Box
                                    width="100%"
                                    className={
                                        activeOption !== 'filters'
                                            ? classes.hiddenOpacity
                                            : ''
                                    }
                                >
                                    {filtersOptionComponent}
                                </Box>
                            )}

                            {activeOption === 'edit' && (
                                <Box width="100%">{editOptionComponent}</Box>
                            )}

                            {activeOption === 'comments' && (
                                <Box width="100%">
                                    {commentsOptionComponent}
                                </Box>
                            )}
                            {activeOption === 'settings' &&
                                settingsOptionComponent && (
                                    <Box width="100%">
                                        {settingsOptionComponent}
                                    </Box>
                                )}
                            {footerComponent &&
                                (activeOption === 'edit' ||
                                    activeOption === 'filters') && (
                                    <div
                                        className={
                                            classes.innerDrawerFooterContent
                                        }
                                    >
                                        {footerComponent}
                                    </div>
                                )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
