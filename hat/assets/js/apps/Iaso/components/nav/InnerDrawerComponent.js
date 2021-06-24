import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { withStyles, Box, Grid, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';
import { menuHeight } from '../../styles/innerDrawer';

import MESSAGES from './messages';

const styles = theme => ({
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
    },
});

class InnerDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeOption: props.filtersOptionComponent ? 'filters' : 'comments',
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
                                {/* {(editOptionComponent ||
                                filtersOptionComponent) && ( */}
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
                                {commentsOptionComponent && (
                                    <Tab
                                        classes={{
                                            root: classes.innerDrawerTab,
                                        }}
                                        value="comments"
                                        label={
                                            <FormattedMessage
                                                {...MESSAGES.comments}
                                            />
                                        }
                                    />
                                )}
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
                            </Tabs>
                            {/* } */}
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
                                                ? 'hidden-opacity'
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
                                {activeOption === 'settings' && (
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
    commentsOptionComponent: null,
    filtersOptionComponent: null,
    footerComponent: null,
    settingsDisabled: false,
    filtersDisabled: false,
    setCurrentOption: () => null,
    withTopBorder: false,
};

InnerDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.any,
    settingsOptionComponent: PropTypes.object.isRequired,
    editOptionComponent: PropTypes.object,
    filtersOptionComponent: PropTypes.object,
    commentsOptionComponent: PropTypes.object,
    footerComponent: PropTypes.object,
    settingsDisabled: PropTypes.bool,
    filtersDisabled: PropTypes.bool,
    setCurrentOption: PropTypes.func,
    withTopBorder: PropTypes.bool,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(InnerDrawer),
);
