import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core';
import RadioButtonChecked from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import PropTypes from 'prop-types';
import { setCurrentTile } from '../../../redux/mapReducer';

import tiles from '../../../constants/mapTiles';
import commonStyles from '../../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    list: {
        padding: theme.spacing(0, 0, 2, 0),
    },
    icon: {
        marginRight: theme.spacing(1),
        width: 18,
        height: 18,
    },
    title: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        textAlign: 'center',
        fontSize: 15,
    },
    item: {
        fontSize: 14,
    },
});

const MESSAGES = {
    title: {
        id: 'iaso.tile.title',
        defaultMessage: 'Map layers',
    },
    osm: {
        id: 'iaso.tile.osm',
        defaultMessage: 'Open Street Map',
    },
    'arcgis-street': {
        id: 'iaso.tile.arcgis.street',
        defaultMessage: 'ArcGIS Street Map',
    },
    'arcgis-satellite': {
        id: 'iaso.tile.arcgis.satellite',
        defaultMessage: 'ArcGIS Satellite Map',
    },
    'arcgis-topo': {
        id: 'iaso.tile.arcgis.topo',
        defaultMessage: 'ArcGIS Topo Map',
    },
};

function TileSwitchComponent(props) {
    const {
        currentTile,
        classes,
        intl: {
            formatMessage,
        },
    } = props;
    return (
        <Fragment>
            <Box
                px={2}
                className={classes.innerDrawerToolbar}
                component="div"
            >
                <Typography variant="subtitle1">
                    {formatMessage(MESSAGES.title)}
                </Typography>
            </Box>
            <Divider />
            <Box
                p={2}
                className={classes.innerDrawerContent}
                component="div"
            >
                <List className={classes.list}>
                    {
                        Object.keys(tiles).map((key) => {
                            const tile = tiles[key];
                            const isCurrentTile = currentTile.url === tile.url;
                            return (
                                <ListItem
                                    selected={isCurrentTile}
                                    key={key}
                                    button
                                    onClick={() => props.setCurrentTile(tile)}
                                >
                                    {
                                        isCurrentTile
                                        && <RadioButtonChecked color="primary" className={classes.icon} />
                                    }
                                    {
                                        !isCurrentTile
                                        && <RadioButtonUnchecked className={classes.icon} />
                                    }
                                    <ListItemText
                                        primary={formatMessage(MESSAGES[key])}
                                        classes={{
                                            primary: classes.item,
                                        }}
                                    />
                                </ListItem>
                            );
                        })
                    }
                </List>
            </Box>
        </Fragment>
    );
}

TileSwitchComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentTile: PropTypes.object.isRequired,
    setCurrentTile: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentTile: currentTile => dispatch(setCurrentTile(currentTile)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(TileSwitchComponent)),
);
