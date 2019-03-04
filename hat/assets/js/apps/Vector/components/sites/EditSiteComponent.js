import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import TabsComponent from '../../../../components/TabsComponent';
import SiteInfos from './SiteInfos';
import TrapsMap from './TrapsMap';
import LayersComponent from '../../../../components/LayersComponent';
import { getRequest } from '../../../../utils/fetchData';
import { mapActions } from '../../redux/mapReducer';
import { vectorActions } from '../../redux/vectorReducer';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'vector.labels.infos',
    },
    catches: {
        defaultMessage: 'Pièges',
        id: 'vector.labels.catches',
    },
});
class EditSiteComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            site: props.site,
            isChanged: false,
            currentTab: 'infos',
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            site: nextProps.site,
            isChanged: false,
        });
    }

    updateSiteField(key, value) {
        const newSite = Object.assign({}, this.state.site, { [key]: value });
        this.setState({
            site: newSite,
            isChanged: true,
        });
    }


    render() {
        const { site, currentTab } = this.state;
        const {
            saveSite,
            intl: {
                formatMessage,
            },
            map: {
                baseCatchLayer,
            },
            changeLayer,
            trapEdited,
            isTrapUpdated,
            trapUpdated,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal large extra">
                    <TabsComponent
                        isRedirecting={false}
                        selectTab={key => (this.setState({ currentTab: key }))}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.catches), key: 'traps' },
                        ]}
                        defaultSelect={currentTab}
                        currentTab={currentTab}
                    />
                    {
                        currentTab === 'infos' &&
                        <SiteInfos
                            site={site}
                            updateSiteField={(key, value) => this.updateSiteField(key, value)}
                            profiles={this.props.profiles}
                        />
                    }
                    <div className={`${currentTab !== 'traps' ? 'hidden-opacity' : ''} third-container small-filters`} >
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
                                        <FormattedMessage id="vector.modal.legend.site" defaultMessage="Site" />
                                    </li>
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--traps--selected" />
                                        <FormattedMessage id="vector.modal.legend.selectedTraps" defaultMessage="Piège sélectionné" />
                                    </li>
                                    <li className="map__option__list__item">
                                        <i className="map__option__icon--traps--not-selected" />
                                        <FormattedMessage id="vector.modal.legend.notSelectedTraps" defaultMessage="Piège non sélectionné" />
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="traps-map-container">
                            <TrapsMap
                                baseLayer={baseCatchLayer}
                                site={site}
                                getShape={type => this.props.getShape(type)}
                                saveTrap={this.props.saveTrap}
                                trapEdited={trapEdited}
                                isTrapUpdated={isTrapUpdated}
                                trapUpdated={trapUpdated}
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
                        <button
                            disabled={
                                (site.name === '' ||
                                    !this.state.isChanged)
                            }
                            className="button--save"
                            onClick={() => saveSite(site)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="vector.label.savesite" defaultMessage="Sauvegarder le site" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditSiteComponent.defaultProps = {
    site: undefined,
    trapEdited: undefined,
};
EditSiteComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    site: PropTypes.object,
    trapEdited: PropTypes.object,
    intl: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
    saveTrap: PropTypes.func.isRequired,
    isTrapUpdated: PropTypes.bool.isRequired,
    trapUpdated: PropTypes.func.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: url => getRequest(url, dispatch, null, false),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key, true)),
    trapUpdated: isUpdated => dispatch(vectorActions.trapUpdated(isUpdated)),
});

const MapStateToProps = state => ({
    map: state.map,
    isTrapUpdated: state.vectors.isTrapUpdated,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(EditSiteComponent));
