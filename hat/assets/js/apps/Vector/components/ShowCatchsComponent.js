import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { FormattedMessage, injectIntl } from 'react-intl';
import LayersComponent from '../../../components/LayersComponent';
import CatchsMap from './CatchsMap';
import { getRequest } from '../../../utils/fetchData';
import { mapActions } from '../redux/mapReducer';


class ShowCatchsComponent extends Component {
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
                    <FormattedMessage id="vector.modale.catchs.title" defaultMessage="Pièges sur le site" />:
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
                                        <FormattedMessage id="vector.modale.catchs.legend.site" defaultMessage="Site" />
                                    </li>
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--catchs" />
                                        <FormattedMessage id="vector.modale.catchs.legend.catchs" defaultMessage="Pièges" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="catchs-map-container">
                            <CatchsMap
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
ShowCatchsComponent.defaultProps = {
    site: {},
};
ShowCatchsComponent.propTypes = {
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


export default connect(MapStateToProps, MapDispatchToProps)(ShowCatchsComponent);
