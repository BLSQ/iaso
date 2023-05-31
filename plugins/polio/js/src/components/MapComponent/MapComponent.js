/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import { TileLayer, MapContainer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
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

import { CustomZoomControl } from '../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomZoomControl.tsx';

const findBackgroundShape = (shape, backgroundShapes) => {
    return backgroundShapes.filter(
        backgroundShape => backgroundShape.id === shape.parent_id,
    )[0]?.name;
};

const boundsOptions = {
    padding: [5, 5],
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

    return (
        <MapContainer
            style={{ height }}
            center={[0, 0]}
            zoom={3}
            // zoomControl={false}
            scrollWheelZoom={false}
            bounds={fitToBounds ? bounds : null}
            boundsOptions={boundsOptions}
            zoomControl={false}
        >
            <CustomZoomControl
                bounds={bounds}
                boundsOptions={boundsOptions}
                fitOnLoad={fitToBounds}
            />
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* <MapPanes
                backgroundLayer={backgroundLayer}
                mainLayer={mainLayer}
                getMainLayerStyle={getMainLayerStyle}
                getBackgroundLayerStyle={getBackgroundLayerStyle}
                onSelectShape={onSelectShape}
                makePopup={makePopup}
                tooltipLabels={tooltipLabels}
                name={name}
            /> */}
            <Pane name={`BackgroundLayer-${name}`}>
                {backgroundLayer?.length > 0 &&
                    backgroundLayer.map(shape => (
                        <GeoJSON
                            key={shape.id}
                            data={shape.geo_json}
                            style={() => getBackgroundLayerStyle(shape)}
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
                            eventHandlers={{
                                click: () => onSelectShape(shape),
                            }}
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
        </MapContainer>
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
