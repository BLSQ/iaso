import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { FormattedMessage, injectIntl } from 'react-intl';
import LayersComponent from '../../../components/LayersComponent';
import CatchesMap from './CatchesMap';
import { getRequest } from '../../../utils/fetchData';
import { mapActions } from '../redux/mapReducer';


class ShowCatchesComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            site: props.site,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            site: nextProps.site,
        });
    }


    render() {
        const { site } = this.state;
        const {
            map: {
                baseCatchLayer,
            },
            changeLayer,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.catches.title" defaultMessage="Déploiements sur le site" />:
                    {' '}{site.name}
                </div>
                <section className="edit-modal large extra">
                    <div className="third-container small-filters">
                        <div>
                            <LayersComponent
                                base={baseCatchLayer}
                                change={(type, key) => changeLayer(type, key)}
                            />
                            <div className="map__option padding-top">
                                <span className="map__option__header">
                                    <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                </span>
                                <ul className="map__option__list legend">
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--site" />
                                        <FormattedMessage id="vector.modale.catches.legend.site" defaultMessage="Site" />
                                    </li>
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--catches" />
                                        <FormattedMessage id="vector.modale.catches.legend.catches" defaultMessage="Déploiements" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="catches-map-container">
                            <CatchesMap
                                baseLayer={baseCatchLayer}
                                site={site}
                                getShape={type => this.props.getShape(type)}
                            />
                        </div>
                    </div>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
ShowCatchesComponent.defaultProps = {
    site: {},
};
ShowCatchesComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    site: PropTypes.object,
    getShape: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: url => getRequest(url, dispatch, null, false),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key, true)),
});

const MapStateToProps = state => ({
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(ShowCatchesComponent);
