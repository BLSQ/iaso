/* eslint-disable camelcase */
import { Map, TileLayer } from 'react-leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { geoJSON } from 'leaflet';
import {
    arrayOf,
    func,
    object,
    objectOf,
    string,
    number,
    bool,
} from 'prop-types';
import { MapPanes } from './MapPanes.tsx';

export const MapComponent = ({
    name,
    onSelectShape,
    mainLayer,
    backgroundLayer,
    getMainLayerStyle,
    getBackgroundLayerStyle,
    tooltipLabels,
    height,
    fitToBounds,
    makePopup,
    fitBoundsToBackground,
}) => {
    const map = useRef();

    // When there is no data, bounds is undefined, so default center and zoom is used,
    // when the data get there, bounds change and the effect focus on it via the deps
    const bounds = useMemo(() => {
        const referenceLayer = fitBoundsToBackground
            ? backgroundLayer
            : mainLayer;
        if (!referenceLayer || referenceLayer.length === 0) {
            return null;
        }
        const bounds_list = referenceLayer
            .map(orgunit => geoJSON(orgunit.geo_json).getBounds())
            .filter(b => b !== undefined);
        if (bounds_list.length === 0) {
            return null;
        }
        console.log('bounds_list', bounds_list);
        const newBounds = bounds_list[0];
        newBounds.extend(bounds_list);
        return newBounds;
    }, [mainLayer, fitBoundsToBackground, backgroundLayer]);
    console.log('bounds', bounds);
    console.log('map bounds', map.current?.leafletElement.getBounds());

    useEffect(() => {
        if (bounds && bounds.isValid() && fitToBounds) {
            map.current?.leafletElement.fitBounds(bounds);
        }
    }, [bounds, fitToBounds]);
    return (
        <Map
            ref={map}
            style={{ height }}
            center={[0, 0]}
            zoom={3}
            // zoomControl={false}
            scrollWheelZoom={false}
            bounds={fitToBounds ? bounds : null}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapPanes
                backgroundLayer={backgroundLayer}
                mainLayer={mainLayer}
                getMainLayerStyle={getMainLayerStyle}
                getBackgroundLayerStyle={getBackgroundLayerStyle}
                onSelectShape={onSelectShape}
                makePopup={makePopup}
                tooltipLabels={tooltipLabels}
                name={name}
            />
        </Map>
    );
};

MapComponent.propTypes = {
    name: string.isRequired,
    onSelectShape: func,
    mainLayer: arrayOf(object),
    backgroundLayer: arrayOf(object),
    getMainLayerStyle: func,
    getBackgroundLayerStyle: func,
    tooltipLabels: objectOf(string),
    height: number,
    fitToBounds: bool,
    makePopup: func,
    fitBoundsToBackground: bool,
    withZoomControl: bool,
};

MapComponent.defaultProps = {
    height: 500,
    onSelectShape: () => null,
    mainLayer: [],
    backgroundLayer: [],
    fitToBounds: true,
    getMainLayerStyle: () => null,
    getBackgroundLayerStyle: () => null,
    tooltipLabels: { main: 'District', background: 'Region' },
    makePopup: () => null,
    fitBoundsToBackground: false,
    withZoomControl: false,
};
