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
import LayersIcon from '@material-ui/icons/Layers';
import EditIcon from '@material-ui/icons/Edit';
import Clear from '@material-ui/icons/Clear';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    box: {
        width: '100%',
        height: theme.spacing(8),
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
    },
    boxContent: {
        width: '100%',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
    },
    filterButton: {
        marginLeft: 'auto',
    },
    drawerToolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 90,
    },
    drawerContent: {
        width: '20vw',
    },
    drawerCloseButton: {
        marginLeft: 'auto',
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    mapContainerNoDraw: {
        ...commonStyles(theme).mapContainer,
        marginBottom: 0,
        '& .marker-cluster': {
            backgroundColor: `rgba(${theme.palette.primary.main}, 0.6)`,
        },
        '& .marker-cluster.primary > div': {
            backgroundColor: theme.palette.primary.main,
        },
        '& .leaflet-draw.leaflet-control': {
            display: 'none',
        },
    },
});

class MapOptions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeOption: 'layers',
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
            layersOptionComponent,
        } = this.props;
        const {
            activeOption,
        } = this.state;
        return (
            <Fragment>
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

                    <Tooltip title={<FormattedMessage id="iaso.label.layers" defaultMessage="Layers" />}>
                        <IconButton
                            className={classes.filterButton}
                            color={activeOption === 'layers' ? 'primary' : 'inherit'}
                            onClick={() => this.toggleOption('layers')}
                        >
                            <LayersIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={<FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />}>
                        <IconButton
                            color={activeOption === 'edit' ? 'primary' : 'inherit'}
                            onClick={() => this.toggleOption('edit')}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={<FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />}>
                        <IconButton
                            color={activeOption === 'filters' ? 'primary' : 'inherit'}
                            onClick={() => this.toggleOption('filters')}
                        >
                            <FilterIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box
                    p={2}
                    className={classes.boxContent}
                    component="div"
                    border={1}
                    borderTop={0}
                    borderColor="grey.300"
                >

                    <Grid container spacing={2}>
                        <Grid item xs={7} md={8} lg={9} className={classes.mapContainerNoDraw}>
                            {children}
                        </Grid>
                        <Grid item xs={5} md={4} lg={3}>

                            {
                                activeOption === 'edit'
                                && (
                                    editOptionComponent
                                )
                            }

                            {
                                activeOption === 'layers'
                                && (
                                    layersOptionComponent
                                )
                            }

                            {
                                activeOption === 'filters'
                                && (
                                    <Fragment>
                                        <Box
                                            px={2}
                                            className={classes.drawerToolbar}
                                            component="div"
                                        >
                                            <Typography variant="h6" component="h6">
                                                <FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />
                                            </Typography>
                                            <IconButton
                                                className={classes.drawerCloseButton}
                                                color="inherit"
                                                aria-label="Menu"
                                                onClick={() => this.toggleOption('filters')}
                                            >
                                                <Clear />
                                            </IconButton>
                                        </Box>
                                        <Divider />
                                        <Box
                                            p={2}
                                            className={classes.drawerContent}
                                            component="div"
                                        >
                                            CONTENT
                                        </Box>
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

MapOptions.defaultProps = {
    children: null,
};

MapOptions.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.any,
    editOptionComponent: PropTypes.object.isRequired,
    layersOptionComponent: PropTypes.object.isRequired,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(MapOptions),
);
