import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';


class VectorSync extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <section>
                <div className="widget__container">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    }
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="VectorSync.Title2" defaultMessage="Synchronisation des données" />
                        </h2>
                    </div>
                </div>
            </section>);
    }
}

VectorSync.defaultProps = {
};

VectorSync.propTypes = {
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const VectorSyncIntl = injectIntl(VectorSync);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorSyncIntl);
