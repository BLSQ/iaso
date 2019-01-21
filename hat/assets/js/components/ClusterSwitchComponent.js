import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

const MESSAGES = defineMessages({
    withCluster: {
        id: 'vactor.map.with',
        defaultMessage: 'Avec',
    },
    withOutCluster: {
        id: 'vactor.map.without',
        defaultMessage: 'Sans',
    },
});

class ClusterSwitchComponent extends Component {
    render() {
        const { withCluster, change, message } = this.props;
        return (
            <div className="map__option">
                <span className="map__option__header">
                    {message}
                </span>
                <ul className="map__option__list">
                    <li
                        className={`interactive map__option__list__item${withCluster ? ' active' : ''}`}
                        onClick={() => change(true)}
                    >
                        <i className={`map__option__icon${withCluster ? ' active' : ''}`} />
                        <FormattedMessage {...MESSAGES.withCluster} />
                    </li>
                    <li
                        className={`interactive map__option__list__item${!withCluster ? ' active' : ''}`}
                        onClick={() => change(false)}
                    >
                        <i className={`map__option__icon${!withCluster ? ' active' : ''}`} />
                        <FormattedMessage {...MESSAGES.withOutCluster} />
                    </li>
                </ul>
            </div>
        );
    }
}

ClusterSwitchComponent.propTypes = {
    withCluster: PropTypes.bool.isRequired,
    change: PropTypes.func.isRequired,
    message: PropTypes.string.isRequired,
};

export default injectIntl(ClusterSwitchComponent);
