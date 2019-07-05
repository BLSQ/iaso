import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Map, TileLayer, Marker, Popup,
} from 'react-leaflet';
import L from 'leaflet';


const positions = [
    [-23.568767, -46.649907],
    [-23.565972, -46.650859],
    [-23.563703, -46.653542],
    [-23.616359, -46.664749],
    [-23.624203, -46.683369],
    [-23.565972, -46.650859],
    [-23.572424, -46.65384],
    [-23.610235, -46.69591],
    [-23.609215, -46.69753],
    [-23.608786, -46.697448],
    [-23.617262, -46.674802],
    [-23.620757, -46.673658],
    [-23.625349, -46.692239],
    [-23.565972, -46.650859],
    [-23.564909, -46.654558],
    [-23.642676, -46.672727],
    [-23.608786, -46.697448],
    [-23.610652, -46.686046],
    [-23.573285, -46.689102],
    [-23.609215, -46.667182],
    [-23.609215, -46.667182],
    [-23.60997, -46.667902],
    [-23.584718, -46.675473],
    [-23.584718, -46.675473],
    [-23.607909, -46.692784],
    [-23.594718, -46.635473],
    [-23.564552, -46.654713],
    [-23.573263, -46.695077],
    [-23.633372, -46.680053],
    [-23.64717, -46.727572],
    [-23.576715, -46.68747],
    [-23.609215, -46.667182],
    [-23.609215, -46.667182],
    [-23.52631, -46.616194],
    [-23.614064, -46.668883],
    [-23.608786, -46.697448],
    [-23.587921, -46.6767],
    [-23.573691, -46.643678],
    [-23.573691, -46.643678],
    [-23.627158, -46.675183],
    [-23.573263, -46.695077],
    [-23.573263, -46.695077],
    [-23.572269, -46.689863],
    [-23.573263, -46.695077],
    [-23.628932, -46.665837],
    [-23.61506, -46.659242],
    [-23.528071, -46.586955],
    [-23.595269, -46.669645],
    [-23.596066, -46.686917],
    [-23.627158, -46.675183],
];

const getLatLngBounds = () => {
    const latLngs = positions.map(position => L.latLng(position[0], position[1]));
    const bounds = L.latLngBounds(latLngs);
    return bounds;
};

class InstancesMap extends Component {
    render() {
        const { instances } = this.props;
        return (

            <Map bounds={getLatLngBounds()} zoom={13}>
                <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" />
                {
                    positions.map((i) => {
                        // const position = [i.latitutide, i.longitude];
                        const position = [i[0], i[1]];
                        return (
                            <Marker position={position}>
                                <Popup>
                                    Expected: This popup can get out of the maps viewport
                                </Popup>
                            </Marker>
                        );
                    })
                }
            </Map>
        );
    }
}

InstancesMap.defaultProps = {
    instances: [],
};

InstancesMap.propTypes = {
    instances: PropTypes.array,
};


export default InstancesMap;
