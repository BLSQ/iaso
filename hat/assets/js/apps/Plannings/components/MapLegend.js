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
import { FormattedMessage, injectIntl } from 'react-intl';


class MapLegend extends Component {
    render() {
        const { formatMessage } = this.props.intl;

        return (
            <div className="map__option">
                <span className="map__option__header">
                    <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                </span>
                <form>
                    <ul className="map__option__list">
                        {this.props.items.map(item => (
                            <li key={item.key} className="map__option__list__item">
                                <i className={`map__option__icon--${item.key}`} />
                                {formatMessage({
                                    defaultMessage: item.defaultMessage,
                                    id: item.messageKey,
                                })}
                            </li>))}
                    </ul>
                </form>
            </div>
        );
    }
}

MapLegend.propTypes = {
    items: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(MapLegend);
