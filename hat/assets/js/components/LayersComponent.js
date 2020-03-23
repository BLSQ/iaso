import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

const mapLayerTypes = {
    legend: 1,
    baseLayer: 2,
    overlay: 3,
};

const mapBaseLayers = [
    'blank',
    'osm',
    'arcgis-street',
    'arcgis-satellite',
    'arcgis-topo',
];

const MESSAGES = defineMessages({
    // base layers
    blank: {
        id: 'microplanning.layer.blank',
        defaultMessage: 'None',
    },
    osm: {
        id: 'microplanning.layer.osm',
        defaultMessage: 'Open Street Map',
    },
    'arcgis-street': {
        id: 'microplanning.layer.arcgis.street',
        defaultMessage: 'ArcGIS Street Map',
    },
    'arcgis-satellite': {
        id: 'microplanning.layer.arcgis.satellite',
        defaultMessage: 'ArcGIS Satellite Map',
    },
    'arcgis-topo': {
        id: 'microplanning.layer.arcgis.topo',
        defaultMessage: 'ArcGIS Topo Map',
    },

    // overlays
    labels: {
        id: 'microplanning.overlay.village.names',
        defaultMessage: 'Village names',
    },
});
const LayersComponent = ({
    base, change,
}) => (
    <div className="map__option">
        <span className="map__option__header">
            <FormattedMessage id="microplanning.label.layers" defaultMessage="Map layers" />
        </span>
        <ul key="base-layers" className="map__option__list">
            {mapBaseLayers.map(key => (
                <li
                    key={key}
                    className={`interactive map__option__list__item${key === base ? ' active' : ''}`}
                    onClick={() => change(mapLayerTypes.baseLayer, key)}
                >
                    <i className={`map__option__icon${key === base ? ' active' : ''}`} />
                    <FormattedMessage {...MESSAGES[key]} />
                </li>
            ))}
        </ul>
    </div>
);

LayersComponent.propTypes = {
    base: PropTypes.string.isRequired,
    change: PropTypes.func.isRequired,
};

export default injectIntl(LayersComponent);
