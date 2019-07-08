import React, { Component } from 'react';
import {
    Map, TileLayer, Marker, Popup,
} from 'react-leaflet';
import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import { getLatLngBounds, isValidCoordinate } from '../utils/mapUtils';

const styles = () => ({
    link: {
        wordBreak: 'break-all',
    },
});

class InstancesMap extends Component {
    render() {
        const { instances, classes } = this.props;
        return (
            <Map
                bounds={getLatLngBounds(instances)}
                boundsOptions={{ padding: [50, 50] }}
                zoom={13}
            >
                <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                {
                    instances.map((i) => {
                        if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
                        return (

                            <Marker position={[i.latitude, i.longitude]} key={i.id}>
                                <Popup>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <FormattedMessage id="iaso.instance.latitude" defaultMessage="Latitude" />
                                                    :
                                                </td>
                                                <td>
                                                    {i.latitude}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <FormattedMessage id="iaso.instance.longitude" defaultMessage="Longitude" />
                                                    :
                                                </td>
                                                <td>
                                                    {i.longitude}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <FormattedMessage id="iaso.instance.updated_at" defaultMessage="Mise à jour" />
                                                    :
                                                </td>
                                                <td>
                                                    {moment.unix(i.updated_at).format('DD/MM/YYYY HH:mm')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <FormattedMessage id="iaso.instance.created_at" defaultMessage="Création" />
                                                    :
                                                </td>
                                                <td>
                                                    {moment.unix(i.created_at).format('DD/MM/YYYY HH:mm')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <FormattedMessage id="iaso.instance.file" defaultMessage="Fichier" />
                                                    :
                                                </td>
                                                <td className={classes.link}>
                                                    <a target="_blank" rel="noopener noreferrer" href={i.file_url}>{i.file_name}</a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Popup>
                            </Marker>
                        );
                    })
                }
            </Map>
        );
    }
}

InstancesMap.propTypes = {
    classes: PropTypes.object.isRequired,
    instances: PropTypes.array.isRequired,
};


export default withStyles(styles)(InstancesMap);
