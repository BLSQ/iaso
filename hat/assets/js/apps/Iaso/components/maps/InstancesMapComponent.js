import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer, Marker, Popup,
} from 'react-leaflet';
import { FormattedMessage } from 'react-intl';

import {
    withStyles,
    Grid,
    CardMedia,
    CardContent,
    Card,
    Hidden,
} from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import { getLatLngBounds, isValidCoordinate } from '../../utils/mapUtils';

import TileSwitch from './TileSwitchComponent';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    popup: {
        margin: 0,
        '& .leaflet-popup-content': {
            margin: 0,
        },
        '& .leaflet-popup-close-button': {
            color: 'white !important',
        },
    },
    link: {
        wordBreak: 'break-all',
    },
    listItemLabel: {
        textAlign: 'right',
        fontWeight: 'bold',
        display: 'inline-block',
        paddingRight: theme.spacing(1) / 2,
    },
    listItem: {
        textAlign: 'left',
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'none',
    },
    cardMedia: {
        height: 120,
    },
    cardContent: {
        margin: theme.spacing(2),
        overflow: 'hidden',
        wordBreak: 'break-all',
        padding: '0 !important',
    },
    fileList: {
        paddingLeft: theme.spacing(2),
    },
    fileItem: {
        position: 'relative',
        left: -theme.spacing(1) / 2,
    },
});

class InstancesMap extends Component {
    render() {
        const { instances, classes, currentTile } = this.props;
        return (
            <Grid container spacing={4}>
                <Grid item xs={10} className={classes.mapContainer}>
                    <Map
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        bounds={getLatLngBounds(instances)}
                        boundsOptions={{ padding: [50, 50] }}
                        zoom={13}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                        {
                            instances.map((i) => {
                                if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
                                return (
                                    <Marker position={[i.latitude, i.longitude]} key={i.id}>
                                        <Popup className={classes.popup}>
                                            <Card className={classes.card}>
                                                {
                                                    i.files && i.files.length > 0
                                                    && (
                                                        <CardMedia
                                                            className={classes.cardMedia}
                                                            image={i.files[0]}
                                                            href={i.files[0]}
                                                        />
                                                    )
                                                }
                                                <CardContent className={classes.cardContent}>
                                                    <Grid container spacing={0}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.label.name" defaultMessage="Name" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            {i.org_unit.name}
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={0}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.label.type" defaultMessage="Type" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            {i.org_unit.org_unit_type_name}
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={0}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.instance.device" defaultMessage="IMEI device" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            {i.device_id ? i.device_id : '/'}
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={1}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.instance.coordinate" defaultMessage="Coordinates" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            {' '}
                                                            Long:
                                                            {' '}
                                                            {i.longitude}
                                                            {' '}
                                                            <br />
                                                            {' '}
                                                            Lat:
                                                            {' '}
                                                            {i.latitude}
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={0}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.instance.created_at" defaultMessage="Created at" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            {moment.unix(i.created_at).format('DD/MM/YYYY HH:mm')}
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={0}>
                                                        <Grid item xs={4} className={classes.listItemLabel}>
                                                            <FormattedMessage id="iaso.instance.files" defaultMessage="Files" />
                                                            :
                                                        </Grid>
                                                        <Grid item xs={8} className={classes.listItem}>
                                                            <ul className={classes.fileList}>
                                                                <li>
                                                                    <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={i.file_url}>{i.file_name}</a>
                                                                </li>
                                                                {i.files.map(f => (
                                                                    <li key={f}>
                                                                        <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={f}>{f.toString()}</a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Popup>
                                    </Marker>
                                );
                            })
                        }
                    </Map>
                </Grid>
                <Grid item xs={2}>
                    <TileSwitch />
                </Grid>
            </Grid>
        );
    }
}


InstancesMap.propTypes = {
    classes: PropTypes.object.isRequired,
    instances: PropTypes.array.isRequired,
    currentTile: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});

export default withStyles(styles)(connect(MapStateToProps)(InstancesMap));
