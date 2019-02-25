/*
 * This component displays the summary of the selected villages.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class MapSelectionSummary extends Component {
    render() {
        const { data } = this.props;

        if (!data || data.length === 0) {
            return (
                <div className="map__selection__summary--empty">
                    <FormattedMessage id="microplanning.selected.empty" defaultMessage="Nothing selected yet." />
                </div>
            );
        }

        // calculate total villages population
        const { assignationsMap, capacity } = this.props;
        const assignedPopulation = data.filter(village =>
            assignationsMap[village.id]).reduce((prev, curr) => (prev + (curr.population || 0)), 0);
        const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0);

        const displayWarning = parseInt(population, 10) > parseInt(capacity, 10);
        return (
            <div className="map__selection__summary">
                <h4 className="map__selection__summary__heading">
                    <FormattedMessage
                        id="microplanning.selected.selection.title"
                        defaultMessage="Votre sélection:"
                    />
                </h4>
                {
                    displayWarning &&
                    <div className="map__selection__summary__item error-text">
                        <FormattedMessage
                            id="microplanning.selected.warning"
                            defaultMessage="Attention la capicté dépasse la population assignée"
                        />
                    </div>
                }
                <div className="map__selection__summary__item">
                    <FormattedMessage
                        id="microplanning.selected.number"
                        defaultMessage="Villages"
                    />
                    <span className="map__selection__summary__number">{data.length}</span>
                </div>
                <div className={`map__selection__summary__item ${displayWarning ? 'error-text' : ''}`}>
                    <FormattedMessage
                        id="microplanning.selected.capacity"
                        defaultMessage="Capacité"
                    />
                    <span className="map__selection__summary__number">{capacity}</span>
                </div>
                <div className={`map__selection__summary__item tooltip--warning ${displayWarning ? 'error-text' : ''}`}>
                    <FormattedMessage
                        id="microplanning.selected.assignedPopulation"
                        defaultMessage="Population assignée"
                    />
                    <span className="map__selection__summary__number">{assignedPopulation}</span>
                    <div className="tooltip__warning">
                        <FormattedMessage
                            id="microplanning.selected.population.warning.1"
                            defaultMessage="Please note: population estimates may not be accurate."
                        />
                        &nbsp;
                        <FormattedMessage
                            id="microplanning.selected.population.warning.2"
                            defaultMessage="Only villages from Z.S. have population data."
                        />
                        <br />
                        <FormattedMessage
                            id="microplanning.selected.population.warning.3"
                            defaultMessage="Population data included in shape files curated by UCLA and based on Villages from Z.S."
                        />
                    </div>
                </div>
                <div className="map__selection__summary__item tooltip--warning">
                    <FormattedMessage
                        id="microplanning.selected.population"
                        defaultMessage="Population estimée"
                    />
                    <span className="map__selection__summary__number">{population}</span>
                </div>
            </div>
        );
    }
}

MapSelectionSummary.defaultProps = {
    data: [],
    assignationsMap: undefined,
    capacity: 0,
};


MapSelectionSummary.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    assignationsMap: PropTypes.object,
    capacity: PropTypes.number,
};

export default injectIntl(MapSelectionSummary);
