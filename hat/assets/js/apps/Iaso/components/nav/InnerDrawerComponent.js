import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import {
    withStyles,
    Box,
    Typography,
    Tooltip,
    IconButton,
    Divider,
    Grid,
} from '@material-ui/core';

import FilterIcon from '@material-ui/icons/FilterList';
import SettingsIcon from '@material-ui/icons/Settings';
import EditIcon from '@material-ui/icons/Edit';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    box: {
        width: '100%',
        height: theme.spacing(8),
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
    },
    filterButton: {
        marginLeft: 'auto',
    },
    boxContent: {
        width: '100%',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        marginBottom: 0,
        overflow: 'hidden',
    },
});

class InnerDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeOption: 'settings',
        };
    }

    toggleOption(activeOption) {
        this.setState({
            activeOption,
        });
    }

    render() {
        const {
            children,
            title,
            classes,
            editOptionComponent,
            settingsOptionComponent,
            filtersOptionComponent,
            editTitle,
        } = this.props;
        const {
            activeOption,
        } = this.state;
        return (
            <Fragment>
                {
                    (editOptionComponent || filtersOptionComponent) && (
                        <Box
                            px={2}
                            display="flex"
                            alignItems="center"
                            className={classes.box}
                            component="div"
                            border={1}
                            borderColor="grey.300"
                        >
                            <Typography variant="h6" component="h6" color="primary">
                                {title}
                            </Typography>

                            <Tooltip title={<FormattedMessage id="iaso.label.settings" defaultMessage="Settings" />}>
                                <IconButton
                                    className={classes.filterButton}
                                    color={activeOption === 'settings' ? 'primary' : 'inherit'}
                                    onClick={() => this.toggleOption('settings')}
                                >
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>
                            {
                                editOptionComponent && (
                                    <Tooltip title={<FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />}>
                                        <IconButton
                                            color={activeOption === 'edit' ? 'primary' : 'inherit'}
                                            onClick={() => this.toggleOption('edit')}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }
                            {
                                filtersOptionComponent && (
                                    <Tooltip title={<FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />}>
                                        <IconButton
                                            color={activeOption === 'filters' ? 'primary' : 'inherit'}
                                            onClick={() => this.toggleOption('filters')}
                                        >
                                            <FilterIcon />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }
                        </Box>
                    )
                }
                <Box
                    p={0}
                    className={classes.boxContent}
                    component="div"
                    border={1}
                    borderTop={editOptionComponent || filtersOptionComponent ? 0 : 1}
                    borderColor="grey.300"
                    borderRadius={editOptionComponent || filtersOptionComponent ? 0 : 5}
                >

                    <Grid container spacing={0}>
                        <Grid item xs={7} md={8} lg={9} className={classes.mapContainer}>
                            {children}
                        </Grid>
                        <Grid item xs={5} md={4} lg={3}>

                            {
                                activeOption === 'edit'
                                && (
                                    <Fragment>
                                        <Box
                                            px={2}
                                            className={classes.innerDrawerToolbar}
                                            component="div"
                                        >
                                            <Typography variant="h6" component="h6">
                                                {
                                                    editTitle !== '' && editTitle
                                                }
                                                {
                                                    editTitle === '' && <FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />
                                                }
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        {editOptionComponent}
                                    </Fragment>
                                )
                            }

                            {
                                activeOption === 'settings'
                                && (
                                    <Fragment>
                                        <Box
                                            px={2}
                                            className={classes.innerDrawerToolbar}
                                            component="div"
                                        >
                                            <Typography variant="h6" component="h6">
                                                <FormattedMessage id="iaso.label.settings" defaultMessage="Settings" />
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        {settingsOptionComponent}
                                    </Fragment>
                                )
                            }

                            {
                                activeOption === 'filters'
                                && (
                                    <Fragment>
                                        <Box
                                            px={2}
                                            className={classes.innerDrawerToolbar}
                                            component="div"
                                        >
                                            <Typography variant="h6" component="h6">
                                                <FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        {filtersOptionComponent}
                                    </Fragment>
                                )
                            }
                        </Grid>
                    </Grid>
                </Box>
            </Fragment>
        );
    }
}

InnerDrawer.defaultProps = {
    children: null,
    editTitle: '',
    title: '',
    editOptionComponent: null,
    filtersOptionComponent: null,
};

InnerDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string,
    editTitle: PropTypes.string,
    children: PropTypes.any,
    settingsOptionComponent: PropTypes.object.isRequired,
    editOptionComponent: PropTypes.object,
    filtersOptionComponent: PropTypes.object,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(InnerDrawer),
);
