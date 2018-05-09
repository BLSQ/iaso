/*
 * This component contains the list of possible map markers and allows
 * in some cases to show/hide them.
 * (This could have also been represented as a map overlay)
 *
 * In our case,
 *
 * The markers are the village types divided as:
 * 'YES': Villages from Z.S.
 * 'NO': Villages not from Z.S.
 * 'OTHER': Locations where people are found during campaigns
 * 'NA': Villages from satellite (unknown)
 * Default values are all empty, except for types, where the default values is "YES"
 *
 * Other entries are:
 * - `selected`: Selected villages
 * - `highlight`: Highlighted villages (based on filters)
 *
 * The list of possible options is included in the `map` redux file.
 * If the list is updated this files should be updated too,
 * adding new entries in the MESSAGES list with the pertinent labels.
 * The MESSAGE entry keys and the lengend keys MUST match.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

const MESSAGES = defineMessages({
    YES: {
        id: 'microplanning.legend.official',
        defaultMessage: 'Villages NON endémiques',
    },
    OTHER: {
        id: 'microplanning.legend.selectedByOther',
        defaultMessage: "Villages sélectionnés pour une autre équipe que l'équipe courante",
    },

    selected: {
        id: 'microplanning.legend.selected',
        defaultMessage: 'Villages sélectionnés',
    },
    highlight: {
        id: 'microplanning.legend.highlight',
        defaultMessage: 'Villages endémiques',
    },
    insideGeoloc: {
        id: 'microplanning.legend.insideGeoloc',
        defaultMessage: 'Villages dans une AS couverte par l’équipe courante',
    },
    outsideGeoloc: {
        id: 'microplanning.legend.outsideGeoloc',
        defaultMessage: 'Villages dans une AS NON couverte par l’équipe courante',
    },
});

class MapLegend extends Component {
    render() {
        const fixedItems = [
            {
                key: 'highlight',
                isInGeoScope: false,
            },
            {
                key: 'YES',
                isInGeoScope: false,
            },
            {
                key: 'selected',
                isInGeoScope: true,
                iAlwaysDisplayed: true,
            },
            {
                key: 'OTHER',
                isInGeoScope: false,
            },
            {
                key: 'insideGeoloc',
                isInGeoScope: true,
            },
            {
                key: 'outsideGeoloc',
                isInGeoScope: true,
            },
        ];
        return (
            <div className="map__option">
                <span className="map__option__header">
                    <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                </span>
                <form>
                    <ul className="map__option__list">
                        {fixedItems.map((item) => {
                            if ((item.isInGeoScope === this.props.isGeoScopeEnabled)
                                || item.iAlwaysDisplayed) {
                                return (
                                    <li key={item.key} className="map__option__list__item">
                                        <i className={`map__option__icon--${item.key}`} />
                                        <FormattedMessage {...MESSAGES[item.key]} />
                                    </li>
                                );
                            }
                            return true;
                        })}
                    </ul>
                </form>
            </div>
        );
    }
}

MapLegend.propTypes = {
    isGeoScopeEnabled: PropTypes.bool.isRequired,
};

export default injectIntl(MapLegend);
