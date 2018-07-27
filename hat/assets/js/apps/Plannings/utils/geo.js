/*
 * - build clean lists with provinces, zones and areas boundaries
 * - common geo methods (extend properties, search in buffer...)
 */

import L from 'leaflet';
import * as topojson from 'topojson';

import provinces from './provinces.json';

import { capitalize } from '../../../utils';

const clean = word => ((word || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''));
const isEqual = (a, b) => (clean(a) === clean(b));
const areEqual = (a, b, keys) => (keys.every(key => isEqual(a[key], b[key])));
const extendBasic = (division) => {
    const props = division.properties;

    // create fake `id` based on health structure divisions
    props.id = `${clean(props.NEW_PROV)}:${clean(props.ZS)}:${clean(props.AS)}`;

    props.province = capitalize(props.NEW_PROV);
    props.formerProvince = capitalize(props.OLD_PROV);
    props.label = props.province;
    props._keys = ['province'];

    if (props.ZS) {
        props.ZS = capitalize(props.ZS);
        props.label += ` - ${props.ZS}`;
        props._keys = ['ZS'];

        if (props.AS) {
            props.AS = capitalize(props.AS);
            props.label += ` - ${props.AS}`;
            props._keys = ['ZS', 'AS'];
        }
    }
};

const data = {};
// Leaflet doesn't support topoJSON format, transform them to geoJSON format.
data.province = topojson.feature(provinces, provinces.objects.provinces);
// include basic properties in features
data.province.features.forEach(extendBasic);

// circle size in metres depending on the village type
const RADIUS = {
    YES: 350,
    NO: 150,
    OTHER: 100,
    NA: 150,
    highlight: 80, // amount to increase if there were cases
};

const extendDivisionInfo = (division, villages, legend) => {
    const countByType = type => (prev, curr) => (prev + (curr.type === type ? 1 : 0));
    const sum = key => (prev, curr) => (prev + (curr[key] || 0));
    const max = key => (prev, curr) => (!curr[key] || prev >= curr[key] ? prev : curr[key]);

    // find the villages in shape and the plotted ones
    const inDivision = villages.filter(village => areEqual(division, village, division._keys));

    const plotted = inDivision.filter(village => legend[village.type]);

    // find out the date of the last confirmed HAT case
    const lastConfirmedCaseDate = plotted.reduce(max('lastConfirmedCaseDate'), '');

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

const extendVillageInfo = (village) => {
    const _latlon = L.latLng(village.latitude, village.longitude);
    const _isHighlight = (village.nr_positive_cases > 0);
    // take size from village type and increase it if there are cases
    const _radius = RADIUS[village.village_official] + (_isHighlight ? RADIUS.highlight : 0);
    const _class = (_isHighlight ? 'highlight' : village.village_official);
    const _pane = (_isHighlight ? 'highlight' : 'markers');

    return {
        ...village, _isHighlight, _radius, _class, _pane, _latlon,
    };
};

const villagesInBuffer = (plotted, buffer) => {
    const bufferRadius = buffer.getRadius();

    // find out the points within the buffer zone
    const latlon = buffer.getLatLng();
    const { length } = plotted;

    const inBuffer = [];
    for (let i = 0; i < length; i += 1) {
        const village = plotted[i];
        const distance = latlon.distanceTo(village._latlon);
        if (distance <= (bufferRadius + village._radius)) {
            inBuffer.push(village);
        }
    }

    return inBuffer;
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
            if (villageA._isHighli || villageB._isHighlight) {
            // compare distance
                const distance = villageB._latlon.distanceTo(villageA._latlon);
                if (distance <= (radius + villageB._radius)) {
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

export default {
    isEqual,
    areEqual,
    center: [-4.4233379, 16.2113064],
    zoom: 7,
    data,
    extendDivisionInfo,
    extendVillageInfo,
    villagesInBuffer,
    villagesInHighlightBuffer,
    extendBasic,
    zoomDelta: 0.50,
    zoomSnap: 0.50,
};
