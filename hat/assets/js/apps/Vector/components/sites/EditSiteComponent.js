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
import RadiosComponent from '../../../../components/RadiosComponent';
import { itemsEditSitesToShow, MESSAGES } from '../../utlls/vectorMapUtils';
import CustomTableComponent from '../../../../components/CustomTableComponent';
import trapsColumns from '../../utlls/trapsColumns';

const LOCAL_MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'vector.labels.infos',
    },
    catches: {
        defaultMessage: 'Liste des pièges',
        id: 'vector.labels.traps',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'vector.labels.map',
    },
});
class EditSiteComponent extends Component {
    constructor(props) {
        super(props);
        const itemsToShow = itemsEditSitesToShow.slice();
        this.state = {
            showModale: props.showModale,
            trapsColumns: trapsColumns(
                props.intl.formatMessage,
                MESSAGES,
                (id, urlKey, key) => {
                    props.getDetail(id, urlKey, key);
                },
            ),
            site: props.site,
            isChanged: false,
            currentTab: 'infos',
            itemsToShow,
            mapUpdated: false,
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

    setMapUpdate(mapUpdated) {
        this.setState({
            mapUpdated,
        });
    }

    updateSiteField(key, value) {
        const newSite = Object.assign({}, this.state.site, { [key]: value });
        this.setState({
            site: newSite,
            isChanged: true,
        });
    }

    toggleItems(itemsToShow) {
        this.setState({
            itemsToShow,
            mapUpdated: true,
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
            getDetail,
            hidden,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
                overlayClassName="transparent-overlay"
                className={hidden ? 'hidden' : ''}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.site.title" defaultMessage="Site" />:
                    {' '}{site.name}
                </div>
                <section className="edit-modal large extra">
                    <div className="tabs-relative">
                        <TabsComponent
                            isRedirecting={false}
                            selectTab={key => (this.setState({ currentTab: key }))}
                            tabs={[
                                { label: formatMessage(LOCAL_MESSAGES.infos), key: 'infos' },
                                { label: formatMessage(LOCAL_MESSAGES.map), key: 'map' },
                                { label: formatMessage(LOCAL_MESSAGES.catches), key: 'traps' },
                            ]}
                            defaultSelect={currentTab}
                            currentTab={currentTab}
                        />
                    </div>
                    <div className="padding bordered round">
                        {
                            currentTab === 'infos' &&
                            <SiteInfos
                                site={site}
                                updateSiteField={(key, value) => this.updateSiteField(key, value)}
                                profiles={this.props.profiles}
                            />
                        }
                        <div className={`${currentTab !== 'map' ? 'hidden-opacity' : ''} third-container small-filters`} >
                            <div>
                                <LayersComponent
                                    base={baseCatchLayer}
                                    change={(type, key) => changeLayer(type, key)}
                                />
                                <div className="map__option padding-top">
                                    <span className="map__option__header">
                                        <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                    </span>
                                    <RadiosComponent
                                        showItems={items => this.toggleItems(items)}
                                        items={this.state.itemsToShow}
                                    />
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
                                    itemsToShow={this.state.itemsToShow}
                                    mapUpdated={this.state.mapUpdated}
                                    setMapUpdate={mapUpdated => this.setMapUpdate(mapUpdated)}
                                    getDetail={(id, urlKey, key) => getDetail(id, urlKey, key)}
                                />
                            </div>
                        </div>
                    </div>
                    {
                        currentTab === 'traps' &&
                        <section>
                            <CustomTableComponent
                                isSortable={false}
                                showPagination={false}
                                columns={this.state.trapsColumns}
                                defaultSorted={[{ id: 'created_at', desc: false }]}
                                params={{}}
                                onRowClicked={() => { }}
                                multiSort={false}
                                reduxPage={{
                                    list: site.traps,
                                }}
                                fetchDatas={false}
                                defaultPath="map"
                                canSelect={false}
                                pageSize={100}
                                disableHeaderFixed
                            />
                        </section>
                    }
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
    hidden: PropTypes.bool.isRequired,
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
    getDetail: PropTypes.func.isRequired,
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
