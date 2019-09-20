import React, { Fragment, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import {
    withStyles,
    Box,
    Typography,
    Tooltip,
    IconButton,
    Drawer,
    Divider,
} from '@material-ui/core';

import FilterIcon from '@material-ui/icons/FilterList';
import Clear from '@material-ui/icons/Clear';

import PropTypes from 'prop-types';

const styles = theme => ({
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
});

class MapFilters extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }

    toggleDrawer() {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }

    render() {
        const {
            children, title, classes,
        } = this.props;
        const {
            isOpen,
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

                    <Tooltip title={<FormattedMessage id="iaso.label.filters" defaultMessage="Filters" />}>
                        <IconButton
                            className={classes.filterButton}
                            color="inherit"
                            aria-label="Menu"
                            onClick={() => this.toggleDrawer()}
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
                    {children}
                </Box>

                <Drawer
                    variant="persistent"
                    anchor="right"
                    open={isOpen}
                    className={classes.drawer}
                >
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
                            onClick={() => this.toggleDrawer()}
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
                </Drawer>
            </Fragment>
        );
    }
}

MapFilters.defaultProps = {
    children: null,
};

MapFilters.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.any,
};

const MapDispatchToProps = dispatch => ({
    action: () => dispatch(),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(MapFilters),
);
