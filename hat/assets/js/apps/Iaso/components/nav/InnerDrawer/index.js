import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { withStyles, Box, Grid, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import MESSAGES from '../messages';

import { innerDrawerStyles, menuHeight } from './styles';

const styles = theme => ({
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
});

class InnerDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeOption: props.defaultActiveOption,
        };
    }

    toggleOption(activeOption) {
        this.setState({
            activeOption,
        });
        this.props.setCurrentOption(activeOption);
    }

    render() {
        const {
            children,
            classes,
            editOptionComponent,
            settingsOptionComponent,
            filtersOptionComponent,
            commentsOptionComponent,
            settingsDisabled,
            filtersDisabled,
            withTopBorder,
            footerComponent,
            commentsDisabled,
        } = this.props;
        const { activeOption } = this.state;
        return (
            <>
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
                                        this.toggleOption(newtab)
                                    }
                                >
                                    {filtersOptionComponent && (
                                        <Tab
                                            classes={{
                                                root: classes.innerDrawerTab,
                                            }}
                                            disabled={filtersDisabled}
                                            value="filters"
                                            label={
                                                <FormattedMessage
                                                    {...MESSAGES.filters}
                                                />
                                            }
                                        />
                                    )}
                                    {editOptionComponent && (
                                        <Tab
                                            classes={{
                                                root: classes.innerDrawerTab,
                                            }}
                                            value="edit"
                                            label={
                                                <FormattedMessage
                                                    {...MESSAGES.edit}
                                                />
                                            }
                                        />
                                    )}
                                    {settingsOptionComponent && (
                                        <Tab
                                            classes={{
                                                root: classes.innerDrawerTab,
                                            }}
                                            disabled={settingsDisabled}
                                            value="settings"
                                            label={
                                                <FormattedMessage
                                                    {...MESSAGES.settings}
                                                />
                                            }
                                        />
                                    )}
                                    {commentsOptionComponent && (
                                        <Tab
                                            classes={{
                                                root: classes.innerDrawerTab,
                                            }}
                                            value="comments"
                                            disabled={commentsDisabled}
                                            label={
                                                <FormattedMessage
                                                    {...MESSAGES.comments}
                                                />
                                            }
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
                                    <Box width="100%">
                                        {editOptionComponent}
                                    </Box>
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
                                {footerComponent && activeOption === 'edit' && (
                                    <div
                                        className={
                                            classes.innerDrawerFooterContent
                                        }
                                    >
                                        {footerComponent}
                                    </div>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </>
        );
    }
}

InnerDrawer.defaultProps = {
    children: null,
    editOptionComponent: null,
    settingsOptionComponent: null,
    commentsOptionComponent: null,
    filtersOptionComponent: null,
    footerComponent: null,
    settingsDisabled: false,
    filtersDisabled: false,
    commentsDisabled: false,
    setCurrentOption: () => null,
    withTopBorder: false,
    defaultActiveOption: 'settings',
};

InnerDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.any,
    settingsOptionComponent: PropTypes.object,
    editOptionComponent: PropTypes.object,
    filtersOptionComponent: PropTypes.object,
    commentsOptionComponent: PropTypes.object,
    footerComponent: PropTypes.object,
    settingsDisabled: PropTypes.bool,
    filtersDisabled: PropTypes.bool,
    commentsDisabled: PropTypes.bool,
    setCurrentOption: PropTypes.func,
    withTopBorder: PropTypes.bool,
    defaultActiveOption: PropTypes.string,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(InnerDrawer),
);
