import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import {
    withStyles,
    Box,
    Grid,
    Tabs,
    Tab,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';
import { menuHeight } from '../../styles/innerDrawer';

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
            activeOption: props.filtersOptionComponent ? 'filters' : 'settings',
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
            settingsDisabled,
            filtersDisabled,
        } = this.props;
        const {
            activeOption,
        } = this.state;
        return (
            <Fragment>
                <Box
                    p={0}
                    className={classes.boxContent}
                    component="div"
                >
                    <Grid container spacing={0}>
                        <Grid item xs={7} md={8} lg={9} className={classes.mapContainer}>
                            {children}
                        </Grid>
                        <Grid item xs={5} md={4} lg={3} className={classes.innerDrawerToolContainer}>
                            {
                                (editOptionComponent || filtersOptionComponent)
                                && (
                                    <Tabs
                                        classes={{
                                            root: classes.innerDrawerTabs,
                                        }}
                                        value={activeOption}
                                        indicatorColor="primary"
                                        onChange={(event, newtab) => this.toggleOption(newtab)
                                        }
                                    >
                                        {
                                            filtersOptionComponent && (
                                                <Tab
                                                    classes={{
                                                        root: classes.innerDrawerTab,
                                                    }}
                                                    disabled={filtersDisabled}
                                                    value="filters"
                                                    label={<FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />}
                                                />
                                            )
                                        }
                                        <Tab
                                            classes={{
                                                root: classes.innerDrawerTab,
                                            }}
                                            disabled={settingsDisabled}
                                            value="settings"
                                            label={<FormattedMessage id="iaso.label.settings" defaultMessage="Settings" />}
                                        />
                                        {
                                            editOptionComponent && (
                                                <Tab
                                                    classes={{
                                                        root: classes.innerDrawerTab,
                                                    }}
                                                    value="edit"
                                                    label={<FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />}
                                                />
                                            )
                                        }
                                    </Tabs>
                                )
                            }
                            <Box
                                display="flex"
                                flexWrap="wrap"
                                className={classes.innerDrawerContentContainer}
                                flexDirection="column"
                            >
                                {
                                    filtersOptionComponent
                                    && (
                                        <Box
                                            display="flex"
                                            flexWrap="wrap"
                                            className={activeOption !== 'filters' ? 'hidden-opacity' : ''}
                                            flexDirection="column"
                                        >
                                            {filtersOptionComponent}
                                        </Box>
                                    )
                                }

                                {
                                    activeOption === 'edit'
                                    && editOptionComponent
                                }

                                {
                                    activeOption === 'settings'
                                    && settingsOptionComponent
                                }
                            </Box>

                        </Grid>
                    </Grid>
                </Box>
            </Fragment>
        );
    }
}

InnerDrawer.defaultProps = {
    children: null,
    editOptionComponent: null,
    filtersOptionComponent: null,
    settingsDisabled: false,
    filtersDisabled: false,
    setCurrentOption: () => null,
};

InnerDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.any,
    settingsOptionComponent: PropTypes.object.isRequired,
    editOptionComponent: PropTypes.object,
    filtersOptionComponent: PropTypes.object,
    settingsDisabled: PropTypes.bool,
    filtersDisabled: PropTypes.bool,
    setCurrentOption: PropTypes.func,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(InnerDrawer),
);
