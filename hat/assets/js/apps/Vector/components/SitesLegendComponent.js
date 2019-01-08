import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

const MESSAGES = defineMessages({
    warning: {
        id: 'vactor.map.warning',
        defaultMessage: 'Dernière collecte > 6 mois',
    },
    alert: {
        id: 'vactor.map.alert',
        defaultMessage: 'Pas de collecte',
    },
    small: {
        id: 'vactor.map.small',
        defaultMessage: '< 10 mouches à la dernière collecte',
    },
    medium: {
        id: 'vactor.map.without',
        defaultMessage: '> 10 mouches à la dernière collecte',
    },
    large: {
        id: 'vactor.map.without',
        defaultMessage: '> 100 mouches à la dernière collecte',
    },
});

class SitesLegendComponent extends Component {
    render() {
        const { withCluster } = this.props;
        return (
            <div className="map__option">
                <span className="map__option__header">
                    <FormattedMessage id="vector.label.siteLegend.title" defaultMessage="Légende des sites" />
                </span>
                <ul className="map__option__list">
                    <li
                        className="interactive map__option__list__item"
                    >
                        <i className="map__option__icon--alert" />
                        <FormattedMessage {...MESSAGES.alert} />
                    </li>
                    <li
                        className="interactive map__option__list__item"
                    >
                        <i className="map__option__icon--warning" />
                        <FormattedMessage {...MESSAGES.warning} />
                    </li>
                    <li
                        className="interactive map__option__list__item"
                    >
                        <i className="map__option__icon" />
                        <FormattedMessage {...MESSAGES.small} />
                    </li>
                    <li
                        className="interactive map__option__list__item"
                    >
                        <i className="map__option__icon--medium" />
                        <FormattedMessage {...MESSAGES.medium} />
                    </li>
                    <li
                        className="interactive map__option__list__item"
                    >
                        <i className="map__option__icon--large" />
                        <FormattedMessage {...MESSAGES.large} />
                    </li>
                </ul>
            </div>
        );
    }
}

export default injectIntl(SitesLegendComponent);
