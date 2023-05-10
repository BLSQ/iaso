/* eslint-disable camelcase */
import { Map, TileLayer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
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

const findBackgroundShape = (shape, backgroundShapes) => {
    return backgroundShapes.filter(
        backgroundShape => backgroundShape.id === shape.parent_id,
    )[0]?.name;
};
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
        const newBounds = bounds_list[0];
        newBounds.extend(bounds_list);
        return newBounds;
    }, [mainLayer, fitBoundsToBackground, backgroundLayer]);

    useEffect(() => {
        if (bounds && bounds.isValid() && fitToBounds) {
            map.current?.leafletElement.fitBounds(bounds);
        }
    }, [bounds, fitToBounds]);
    return null;
    return (
        <Map
            ref={map}
            style={{ height }}
            center={[0, 0]}
            zoom={3}
            scrollWheelZoom={false}
            bounds={fitToBounds ? bounds : null}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Pane name={`BackgroundLayer-${name}`}>
                {backgroundLayer?.length > 0 &&
                    backgroundLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getBackgroundLayerStyle(shape)}
                            onClick={() => null}
                        />
                    ))}
            </Pane>
            <Pane name={`MainLayer-${name}`}>
                {mainLayer?.length > 0 &&
                    mainLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getMainLayerStyle(shape)}
                            onClick={() => onSelectShape(shape)}
                        >
                            {makePopup && makePopup(shape)}
                            <Tooltip title={shape.name}>
                                {backgroundLayer?.length > 0 && (
                                    <span>
                                        {`${
                                            tooltipLabels.background
                                        }: ${findBackgroundShape(
                                            shape,
                                            backgroundLayer,
                                        )} > `}
                                    </span>
                                )}
                                <span>
                                    {`${tooltipLabels.main}: ${shape.name}`}
                                </span>
                            </Tooltip>
                        </GeoJSON>
                    ))}
            </Pane>
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
};
