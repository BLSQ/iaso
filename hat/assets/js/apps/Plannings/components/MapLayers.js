/*
 * This component substitute Leaflet layers control
 * More info about this control in:
 * http://leafletjs.com/reference-1.0.3.html#control-layers
 *
 * In our case,
 *
 * The layers are the background tiles or base layers (tile maps).
 * The overlays are at his point only the village names.
 * (the legend entries could have been considered as an overlay too)
 *
 * The list of possible options is included in the `map` redux file.
 * If the list is updated this files should be updated too,
 * adding new entries in the MESSAGES list with the pertinent labels.
 * The MESSAGE entry keys and the layer/overlay keys MUST match.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { mapLayerTypes, mapBaseLayers } from '../redux/map';

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

class MapLayers extends Component {
    render() {
        const { base, overlays, change } = this.props;
        return (
            <div className="map__option">
                <span className="map__option__header">
                    <FormattedMessage id="microplanning.label.layers" defaultMessage="Map layers" />
                </span>
                <ul key="base-layers" className="map__option__list">
                    { mapBaseLayers.map(key => (
                        <li
                            key={key}
                            className={`interactive map__option__list__item${key === base ? ' active' : ''}`}
                            onClick={() => change(mapLayerTypes.baseLayer, key)}
                        >
                            <i className={`map__option__icon${key === base ? ' active' : ''}`} />
                            <FormattedMessage {...MESSAGES[key]} />
                        </li>
                    )) }
                </ul>

                {Object.keys(overlays).length > 0 ?
                    <span className="map__option__header">
                        <FormattedMessage id="microplanning.label.overlays" defaultMessage="Options cartes" />
                    </span> : null
                }
                <ul key="overlays" className="map__option__list">
                    { Object.keys(overlays).map(key => (
                        <li
                            key={key}
                            className={`interactive map__option__list__item${overlays[key] ? ' active' : ''}`}
                            onClick={() => change(mapLayerTypes.overlay, key)}
                        >
                            <i className={`map__option__icon square${overlays[key] ? ' active' : ''}`} />
                            <FormattedMessage {...MESSAGES[key]} />
                        </li>
                    )) }
                </ul>
            </div>
        );
    }
}

MapLayers.defaultProps = {
    overlays: undefined,
    teamId: '',
    base: '',
    change: () => {},
};

MapLayers.propTypes = {
    base: PropTypes.string,
    overlays: PropTypes.object,
    change: PropTypes.func,
    teamId: PropTypes.string,
};

export default injectIntl(MapLayers);
