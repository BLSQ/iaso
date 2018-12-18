import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl, getRequest } from '../../../utils/fetchData';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { mapActions } from '../redux/mapReducer';

import {
    MESSAGES,
    itemsToShow,
} from '../utlls/vectorMapUtils';

import VectorMapComponent from '../components/VectorMapComponent';
import RadiosComponent from '../../../components/RadiosComponent';
import LayersComponent from '../../../components/LayersComponent';
import TabsComponent from '../../../components/TabsComponent';
import sitesColumns from '../utlls/sitesColumns';
import targetsColumns from '../utlls/targetsColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import { filtersVectors, filtersVectors2, filtersVectorsGeo } from '../constants/vectorFilters';
import EditSiteComponent from '../components/EditSiteComponent';
import EditTargetComponent from '../components/EditTargetComponent';

const baseUrl = 'map';

export class Vector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsToShow: itemsToShow(props.params),
            sites: [],
            targets: [],
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: props.params.tab,
            sitesColumns: sitesColumns(props.intl.formatMessage, MESSAGES, this),
            targetsColumns: targetsColumns(props.intl.formatMessage, this),
            showEditSiteModale: false,
            showEditTargetModale: false,
            siteEdited: props.siteEdited,
            targetEdited: props.targetEdited,
        };
    }

    componentWillReceiveProps(newProps) {
        const newState = {
            ...this.state,
            itemsToShow: itemsToShow(newProps.params),
            sites: [],
            targets: [],
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: newProps.params.tab,
            siteEdited: newProps.siteEdited,
            targetEdited: newProps.targetEdited,
        };
        if (newProps.params.sites) {
            newState.sites = newProps.vectors.sites;
        }
        if (newProps.params.targets) {
            newState.targets = newProps.vectors.targets;
        }
        if (newProps.params.nonEndemicVillages) {
            newState.nonEndemicVillages = newProps.vectors.nonEndemicVillages;
        }
        if (newProps.params.endemicVillages) {
            newState.endemicVillages = newProps.vectors.endemicVillages;
        }

        this.setState(newState);
    }

    getDownloadUrl(key) {
        const {
            params: {
                dateFrom,
                dateTo,
                orderSites,
                orderTargets,
            },
        } = this.props;
        let url = `/api/${key}?from=${dateFrom}&to=${dateTo}&csv=True`;
        if ((key === 'targets') && orderTargets) {
            url += `&order=${orderTargets}`;
        }
        if ((key === 'sites') && orderSites) {
            url += `&order=${orderSites}`;
        }
        return url;
    }

    showItems(newItemsToShow) {
        const tempParams = {
            ...this.props.params,
        };
        newItemsToShow.map((i) => {
            if (i.isActive) {
                tempParams[i.id] = 'true';
            } else {
                delete tempParams[i.id];
            }
            return null;
        });
        this.props.redirectTo(baseUrl, tempParams);
    }


    editItem(type, data = undefined) {
        if (type === 'site') {
            this.setState({
                showEditSiteModale: true,
                showEditTargetModale: false,
                siteEdited: data,
            });
        }

        if (type === 'target') {
            this.setState({
                showEditSiteModale: false,
                showEditTargetModale: true,
                targetEdited: data,
            });
        }
    }


    render() {
        const {
            map: {
                baseLayer,
            },
            intl: {
                formatMessage,
            },
            filters: {
                provinces,
                zones,
                areas,
            },
            params,
            getShape,
            changeLayer,
            selectMarker,
            redirectTo,
            reduxSitesPage,
            reduxTargetsPage,
            profiles,
            habitats,
            saveSite,
            saveTarget,
        } = this.props;
        const {
            currentTab,
            sites,
            targets,
            nonEndemicVillages,
            endemicVillages,
        } = this.state;
        const filters = filtersVectors(formatMessage, MESSAGES, profiles, habitats);
        const filters2 = filtersVectors2();
        const geoFilters = filtersVectorsGeo(
            provinces || [],
            zones || [],
            areas || [],
            this.props,
            baseUrl,
        );
        return (
            <section className="vectors-container">
                {
                    this.state.showEditSiteModale &&
                    <EditSiteComponent
                        showModale={this.state.showEditSiteModale}
                        toggleModal={() =>
                            this.setState({
                                showEditSiteModale: !this.state.showEditSiteModale,
                            })}
                        site={this.state.siteEdited}
                        habitats={habitats}
                        saveSite={site => saveSite(site)}
                        profiles={profiles}
                    />
                }
                {
                    this.state.showEditTargetModale &&
                    <EditTargetComponent
                        showModale={this.state.showEditTargetModale}
                        toggleModal={() =>
                            this.setState({
                                showEditTargetModale: !this.state.showEditTargetModale,
                            })}
                        target={this.state.targetEdited}
                        profiles={profiles}
                        saveTarget={target => saveTarget(target)}
                    />
                }
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <PeriodSelectorComponent
                                dateFrom={params.dateFrom}
                                dateTo={params.dateTo}
                                onChangeDate={(dateFrom, dateTo) =>
                                    redirectTo(baseUrl, {
                                        ...params,
                                        dateFrom,
                                        dateTo,
                                    })}
                            />
                        </h2>
                    </div>
                    <div className="widget__content--tier">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={geoFilters}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters2}
                            />
                        </div>
                    </div>
                </div>
                <TabsComponent
                    defaultPath={baseUrl}
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.map), key: baseUrl },
                        { label: formatMessage(MESSAGES.sites), key: 'sites' },
                        { label: formatMessage(MESSAGES.targets), key: 'targets' },
                    ]}
                    defaultSelect={currentTab}
                />
                <div className={`vector-map widget__container ${currentTab === baseUrl ? '' : 'hidden-opacity'}`}>
                    <div className="flex-container">
                        <div className="split-selector-container ">
                            <RadiosComponent
                                showItems={items => this.showItems(items)}
                                items={this.state.itemsToShow}
                            />
                            <div className="margin-top">
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => changeLayer(type, key)}
                                />
                            </div>
                        </div>
                        <div className="split-map big">
                            <VectorMapComponent
                                baseLayer={baseLayer}
                                sites={sites || []}
                                targets={targets || []}
                                endemicVillages={endemicVillages || {}}
                                nonEndemicVillages={nonEndemicVillages || {}}
                                getShape={type => getShape(type)}
                                selectMarker={(itemId, key) => selectMarker(itemId, key)}
                                editItem={(type, data) => this.editItem(type, data)}
                            />
                        </div>
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'sites' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        columns={this.state.sitesColumns}
                        defaultSorted={[{ id: 'created_at', desc: false }]}
                        params={params}
                        onRowClicked={() => { }}
                        multiSort
                        pageSize={50}
                        fetchDatas={false}
                        reduxPage={reduxSitesPage}
                        pageKey="sitesPage"
                        pageSizeKey="sitesPageSize"
                        defaultPath={baseUrl}
                        orderKey="orderSites"
                        canSelect={false}
                    />
                    <div className="align-right">
                        <button
                            className="button--save margin"
                            onClick={() => {
                                window.location.href = this.getDownloadUrl('sites');
                            }}
                        >
                            <i className="fa fa-download" />
                            <FormattedMessage id="main.label.download" defaultMessage="Télécharger" />
                        </button>
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'targets' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        columns={this.state.targetsColumns}
                        defaultSorted={[{ id: 'date_time', desc: false }]}
                        params={params}
                        onRowClicked={() => { }}
                        multiSort
                        fetchDatas={false}
                        reduxPage={reduxTargetsPage}
                        pageSize={50}
                        pageKey="targetsPage"
                        pageSizeKey="targetsPageSize"
                        defaultPath={baseUrl}
                        orderKey="orderTargets"
                        canSelect={false}
                    />
                    <div className="align-right">
                        <button
                            className="button--save margin"
                            onClick={() => {
                                window.location.href = this.getDownloadUrl('targets');
                            }}
                        >
                            <i className="fa fa-download" />
                            <FormattedMessage id="main.label.download" defaultMessage="Télécharger" />
                        </button>
                    </div>
                </div>
            </section>
        );
    }
}
Vector.defaultProps = {
    siteEdited: undefined,
    targetEdited: undefined,
};

Vector.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    vectors: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    reduxSitesPage: PropTypes.object.isRequired,
    reduxTargetsPage: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    filters: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    siteEdited: PropTypes.object,
    targetEdited: PropTypes.object,
};

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    getShape: url => getRequest(url, dispatch, null, false),
    selectMarker: (itemId, key) => getRequest(`/api/${key}/${itemId}`, dispatch),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
});

const MapStateToProps = state => ({
    vectors: state.vectors,
    profiles: state.vectors.profiles,
    habitats: state.vectors.habitats,
    load: state.load,
    map: state.map,
    reduxSitesPage: state.vectors.sitesPage,
    reduxTargetsPage: state.vectors.targetsPage,
    filters: state.geoFilters,
});
const VectorWithIntl = injectIntl(Vector);


export default connect(MapStateToProps, MapDispatchToProps)(VectorWithIntl);
