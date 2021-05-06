/*
 * - build clean lists with provinces, zones and areas boundaries
 * - common geo methods (extend properties, search in buffer...)
 */

import L from 'leaflet';
import shapeUrls from '../constants/shapesUrls';

const clean = word =>
    (word || '')
        .toString()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
const isEqual = (a, b) => clean(a) === clean(b);
const areEqual = (a, b, keys) => keys.every(key => isEqual(a[key], b[key]));

// circle size in metres depending on the village type
const RADIUS = {
    YES: 350,
    NO: 150,
    OTHER: 100,
    NA: 150,
    highlight: 80, // amount to increase if there were cases
};

const extendDivisionInfo = (division, villages, legend) => {
    const countByType = type => (prev, curr) =>
        prev + (curr.type === type ? 1 : 0);
    const sum = key => (prev, curr) => prev + (curr[key] || 0);
    const max = key => (prev, curr) =>
        !curr[key] || prev >= curr[key] ? prev : curr[key];

    // find the villages in shape and the plotted ones
    const inDivision = villages.filter(village =>
        areEqual(division, village, division._keys),
    );

    const plotted = inDivision.filter(village => legend[village.type]);

    // find out the date of the last confirmed HAT case
    const lastConfirmedCaseDate = plotted.reduce(
        max('lastConfirmedCaseDate'),
        '',
    );

    // find out the population and number of villages by type
    const population = inDivision.reduce(sum('population'), 0);
    const villagesOfficial = inDivision.reduce(countByType('YES'), 0);
    const villagesNotOfficial = inDivision.reduce(countByType('NO'), 0);
    const villagesOther = inDivision.reduce(countByType('OTHER'), 0);
    const villagesUnknown = inDivision.reduce(countByType('NA'), 0);

    return {
        ...division,
        lastConfirmedCaseDate,
        population,
        villagesOfficial,
        villagesOther,
        villagesUnknown,
    };
};

const extendVillageInfo = village => {
    const _latlon = L.latLng(village.latitude, village.longitude);
    const _isHighlight = village.nr_positive_cases > 0;
    // take size from village type and increase it if there are cases
    const _radius =
        RADIUS[village.village_official] +
        (_isHighlight ? RADIUS.highlight : 0);
    const _class = _isHighlight ? 'highlight' : village.village_official;
    const _pane = _isHighlight ? 'highlight' : 'markers';

    return {
        ...village,
        _isHighlight,
        _radius,
        _class,
        _pane,
        _latlon,
    };
};

const villagesInHighlightBuffer = (map, plotted, highlightBufferSize) => {
    if (highlightBufferSize === 0) {
        return plotted.filter(village => village._isHighlight);
    }

    const { length } = plotted;
    const bufferSize = 1000 * highlightBufferSize;
    const bufferCircle = L.circle([0, 0], bufferSize);

    // circle needs to be in the map or `getBounds` will fail
    // https://github.com/Leaflet/Leaflet/issues/4629
    map.addLayer(bufferCircle);

    const inBuffer = [];
    for (let i = 0; i < length; i += 1) {
        const villageA = plotted[i];
        if (villageA._isHighlight) {
            inBuffer.push(villageA);
        }

        // move and resize buffer circle
        const radius = villageA._radius + bufferSize;
        bufferCircle._latlng = villageA._latlon;
        bufferCircle.setRadius(radius);
        bufferCircle.redraw();

        for (let j = i + 1; j < length; j += 1) {
            const villageB = plotted[j];

            // if the `longitude` is easter than the current position
            // then exit the loop
            if (villageA._isHighlight || villageB._isHighlight) {
                // compare distance
                const distance = villageB._latlon.distanceTo(villageA._latlon);
                if (distance <= radius + villageB._radius) {
                    if (villageA._isHighlight) {
                        inBuffer.push(villageB);
                    } else {
                        inBuffer.push(villageA);
                    }
                }
            } // ignore and continue
        }
    }

    // remove circle afterwards
    map.removeLayer(bufferCircle);

    return inBuffer;
};

const getShape = (type, element, shapes, shapeOptions, zooms, map) => {
    const newIsLoadingShape = { ...element.state.isLoadingShape, [type]: true };
    element.setState({
        isLoadingShape: newIsLoadingShape,
    });
    return element.props.getShape(shapeUrls[type]).then(response => {
        const shape = shapes[type];
        const minZoomTemp = zooms[type];
        shape.addLayer(L.geoJson(response, shapeOptions(type)));
        map.addLayer(shape);
        const newIsLoadingShapeCallBack = {
            ...element.state.isLoadingShape,
            [type]: false,
        };
        element.setState({
            isLoadingShape: newIsLoadingShapeCallBack,
        });
        if (type === 'province') {
            return shape;
        }
        return minZoomTemp;
    });
};

export default {
    isEqual,
    areEqual,
    center: [-4.4233379, 16.2113064],
    zoom: 7,
    extendDivisionInfo,
    extendVillageInfo,
    villagesInHighlightBuffer,
    zoomDelta: 0.5,
    zoomSnap: 0.1,
    getShape,
};
