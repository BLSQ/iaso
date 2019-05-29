import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl, getRequest } from '../../../utils/fetchData';
import { mapActions } from '../redux/mapReducer';

import {
    MESSAGES,
    itemsToShow,
} from '../utlls/vectorMapUtils';

import VectorMapComponent from '../components/VectorMapComponent';
import VectorModalsComponent from '../components/VectorModalsComponent';
import VectorFiltersComponent from '../components/VectorFiltersComponent';
import ClusterSwitchComponent from '../../../components/ClusterSwitchComponent';
import HighlightAssignedSiteComponent from '../components/HighlightAssignedSiteComponent';
import RadiosComponent from '../../../components/RadiosComponent';
import LayersComponent from '../../../components/LayersComponent';
import TabsComponent from '../../../components/TabsComponent';
import trapsColumns from '../utlls/trapsColumns';
import sitesColumns from '../utlls/sitesColumns';
import targetsColumns from '../utlls/targetsColumns';
import catchesColumns from '../utlls/catchesColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';

const baseUrl = 'map';

export class Vector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsToShow: itemsToShow(props.params),
            sites: [],
            traps: [],
            targets: [],
            catches: [],
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: props.params.tab,
            sitesColumns: sitesColumns(props.intl.formatMessage, (id, urlKey, key) => this.getDetail(id, urlKey, key)),
            trapsColumns: trapsColumns(props.intl.formatMessage, MESSAGES, (id, urlKey, key) => this.getDetail(id, urlKey, key)),
            targetsColumns: targetsColumns(props.intl.formatMessage, (id, urlKey, key) => this.getDetail(id, urlKey, key)),
            catchesColumns: catchesColumns(props.intl.formatMessage, (id, urlKey, key) => this.getDetail(id, urlKey, key)),
            showEditTrapsModale: false,
            showEditSiteModale: false,
            showEditTargetModale: false,
            showEditCatchesModale: false,
            showShapeSelectionModale: false,
            siteEdited: props.siteEdited,
            trapEdited: props.trapEdited,
            targetEdited: props.targetEdited,
            catchEdited: props.catchEdited,
            shapeMarkers: props.shapeMarkers,
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            ...this.state,
            itemsToShow: itemsToShow(newProps.params),
            nonEndemicVillages: newProps.params.nonEndemicVillages ? newProps.vectors.nonEndemicVillages : {},
            endemicVillages: newProps.params.endemicVillages ? newProps.vectors.endemicVillages : {},
            currentTab: newProps.params.tab,
            siteEdited: newProps.siteEdited || this.state.siteEdited,
            trapEdited: newProps.trapEdited || this.state.trapEdited,
            targetEdited: newProps.targetEdited || this.state.targetEdited,
            catchEdited: newProps.catchEdited || this.state.catchEdited,
            shapeMarkers: newProps.shapeMarkers || this.state.shapeMarkers,
            sites: newProps.params.sites ? newProps.vectors.sites : [],
            traps: newProps.params.traps ? newProps.vectors.traps : [],
            targets: newProps.params.targets ? newProps.vectors.targets : [],
            catches: newProps.params.catches ? newProps.vectors.catches : [],
        });
    }

    getDownloadUrl(key, exportFormat = 'csv') {
        const {
            params: {
                dateFrom,
                dateTo,
                orderSites,
                orderTraps,
                orderTargets,
                orderCatches,
                userId,
                habitats,
                onlySelectedTraps,
                onlyIgnoredTraps,
                onlyIgnoredTargets,
                province_id,
                zs_id,
                as_id,
            },
        } = this.props;
        let url = `/api/${key}?from=${dateFrom}&to=${dateTo}&${exportFormat}=True`;
        if (userId) {
            url += `&userId=${userId}`;
        }
        if (habitats) {
            url += `&habitats=${habitats}`;
        }
        if (onlySelectedTraps) {
            url += '&onlySelectedTraps=True';
        }
        if (onlyIgnoredTraps) {
            url += '&onlyIgnoredTargets=True';
        }
        if (onlyIgnoredTargets) {
            url += '&onlyIgnoredTargets=True';
        }
        if (province_id) {
            url += `&province_id=${province_id}`;
        }
        if (zs_id) {
            url += `&zs_id=${zs_id}`;
        }
        if (as_id) {
            url += `&as_id=${as_id}`;
        }
        if ((key === 'targets') && orderTargets) {
            url += `&order=${orderTargets}`;
        }
        if ((key === 'sites') && orderSites) {
            url += `&order=${orderSites}`;
        }
        if ((key === 'traps') && orderTraps) {
            url += `&order=${orderTraps}`;
        }
        if ((key === 'catches') && orderCatches) {
            url += `&order=${orderCatches}`;
        }
        return url;
    }

    getDetail(id, urlKey, key) {
        this.props.getDetail(id, urlKey).then((response) => {
            this.editItem(key, response);
        });
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
        const newState = {
            ...this.state,
            siteEdited: type === 'showEditSiteModale' ? data : this.state.siteEdited,
            trapEdited: type === 'showEditTrapsModale' ? data : this.state.trapEdited,
            targetEdited: type === 'showEditTargetModale' ? data : this.state.targetEdited,
            catchEdited: type === 'showEditCatchesModale' ? data : this.state.catchEdited,
            shapeMarkers: type === 'showShapeSelectionModale' ? data : this.state.shapeMarkers,
        };
        newState[type] = true;
        this.setState(newState);
    }

    selectResponsible(site, responsibleId) {
        const s = site;
        s.responsible_id = responsibleId;
        this.props.saveSite(s);
    }

    toggleModal(key) {
        const newState = {
            ...this.state,
        };
        newState[key] = !newState[key];
        this.setState(newState);
    }


    closeModal(key, dataKey) {
        const newState = {
            ...this.state,
        };
        newState[key] = false;
        newState[dataKey] = {};
        if (dataKey === 'trapEdited') {
            newState.catchEdited = {};
        }
        if (dataKey === 'siteEdited') {
            newState.trapEdited = {};
            newState.catchEdited = {};
        }
        if (dataKey === 'shapeMarkers') {
            newState.shapeMarkers = [];
        }
        this.setState(newState);
    }

    render() {
        const {
            map: {
                baseLayer,
                withCluster,
            },
            intl: {
                formatMessage,
            },
            params,
            getShape,
            changeLayer,
            changeCluster,
            getDetail,
            reduxSitesPage,
            reduxTrapsPage,
            reduxTargetsPage,
            reduxCatchesPage,
            saveSite,
            saveTrap,
            saveTarget,
            saveAssignations,
            profiles,
        } = this.props;
        const {
            currentTab,
            sites,
            traps,
            targets,
            catches,
            nonEndemicVillages,
            endemicVillages,
            showEditCatchesModale,
            showEditSiteModale,
            showEditTrapsModale,
            showEditTargetModale,
            showShapeSelectionModale,
            trapEdited,
            siteEdited,
            targetEdited,
            catchEdited,
            shapeMarkers,
        } = this.state;
        return (
            <section className="vectors-container">
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <VectorModalsComponent
                    closeModal={(key, dataKey) => this.closeModal(key, dataKey)}
                    showModale={{
                        showCatch: showEditCatchesModale,
                        showSite: showEditSiteModale,
                        showTrap: showEditTrapsModale,
                        showTarget: showEditTargetModale,
                        showShapeSelection: showShapeSelectionModale,
                    }}
                    trapEdited={trapEdited}
                    siteEdited={siteEdited}
                    targetEdited={targetEdited}
                    catchEdited={catchEdited}
                    shapeMarkers={shapeMarkers}
                    params={params}
                    saveSite={site => saveSite(site)}
                    saveTrap={site => saveTrap(site)}
                    saveTarget={target => saveTarget(target)}
                    saveAssignations={(sitesList, responsibleId) => saveAssignations(sitesList, responsibleId)}
                    getDetail={(id, urlKey, key) => this.getDetail(id, urlKey, key)}
                />
                <VectorFiltersComponent onSearch={() => this.props.onSearch()} params={params} />
                <TabsComponent
                    defaultPath={baseUrl}
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.map), key: baseUrl },
                        { label: formatMessage(MESSAGES.sites), key: 'sites' },
                        { label: formatMessage(MESSAGES.traps), key: 'traps' },
                        { label: formatMessage(MESSAGES.catches), key: 'catches' },
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
                            <HighlightAssignedSiteComponent
                                params={params}
                                baseUrl={baseUrl}
                                profiles={profiles}
                            />
                            <div className="margin-top">
                                <ClusterSwitchComponent
                                    withCluster={withCluster}
                                    change={withCl => changeCluster(withCl)}
                                    message={formatMessage(MESSAGES.cluster_title)}
                                />
                            </div>
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
                                traps={traps || []}
                                targets={targets || []}
                                catches={catches || []}
                                endemicVillages={endemicVillages || {}}
                                nonEndemicVillages={nonEndemicVillages || {}}
                                getShape={type => getShape(type)}
                                selectMarker={(itemId, key) => getDetail(itemId, key)}
                                editItem={(type, data) => this.editItem(type, data)}
                                withCluster={withCluster}
                                params={params}
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
                        <DownloadButtonsComponent
                            csvUrl={this.getDownloadUrl('sites', 'csv')}
                            xlsxUrl={this.getDownloadUrl('sites', 'xlsx')}
                        />
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'traps' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        columns={this.state.trapsColumns}
                        defaultSorted={[{ id: 'created_at', desc: false }]}
                        params={params}
                        multiSort
                        pageSize={50}
                        fetchDatas={false}
                        reduxPage={reduxTrapsPage}
                        pageKey="trapsPage"
                        pageSizeKey="trapsPageSize"
                        defaultPath={baseUrl}
                        orderKey="orderTraps"
                        canSelect={false}
                    />
                    <div className="align-right">
                        <DownloadButtonsComponent
                            csvUrl={this.getDownloadUrl('sites', 'csv')}
                            xlsxUrl={this.getDownloadUrl('sites', 'xlsx')}
                        />
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'targets' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        columns={this.state.targetsColumns}
                        defaultSorted={[{ id: 'date_time', desc: false }]}
                        params={params}
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
                        <DownloadButtonsComponent
                            csvUrl={this.getDownloadUrl('targets', 'csv')}
                            xlsxUrl={this.getDownloadUrl('targets', 'xlsx')}
                        />
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'catches' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        columns={this.state.catchesColumns}
                        defaultSorted={[{ id: 'setup_date', desc: false }]}
                        params={params}
                        multiSort
                        fetchDatas={false}
                        reduxPage={reduxCatchesPage}
                        pageSize={50}
                        pageKey="catchesPage"
                        pageSizeKey="catchesPageSize"
                        defaultPath={baseUrl}
                        orderKey="orderCatches"
                        canSelect={false}
                    />
                    <div className="align-right">
                        <DownloadButtonsComponent
                            csvUrl={this.getDownloadUrl('catches', 'csv')}
                            xlsxUrl={this.getDownloadUrl('catches', 'xlsx')}
                        />
                    </div>
                </div>
            </section>
        );
    }
}

Vector.defaultProps = {
    siteEdited: null,
    trapEdited: null,
    targetEdited: null,
    catchEdited: null,
};

Vector.propTypes = {
    getDetail: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    changeCluster: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    reduxSitesPage: PropTypes.object.isRequired,
    reduxTrapsPage: PropTypes.object.isRequired,
    reduxTargetsPage: PropTypes.object.isRequired,
    reduxCatchesPage: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTrap: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    saveAssignations: PropTypes.func.isRequired,
    siteEdited: PropTypes.object,
    trapEdited: PropTypes.object,
    targetEdited: PropTypes.object,
    catchEdited: PropTypes.object,
    shapeMarkers: PropTypes.array.isRequired,
    onSearch: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
};

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    getShape: url => getRequest(url, dispatch, null, false),
    getDetail: (itemId, key) => getRequest(`/api/${key}/${itemId}`, dispatch),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    changeCluster: withCluster => dispatch(mapActions.changeCluster(withCluster)),
});

const MapStateToProps = state => ({
    vectors: state.vectors,
    load: state.load,
    map: state.map,
    reduxSitesPage: state.vectors.sitesPage,
    reduxTrapsPage: state.vectors.trapsPage,
    reduxTargetsPage: state.vectors.targetsPage,
    reduxCatchesPage: state.vectors.catchesPage,
    profiles: state.vectors.profiles,
});
const VectorWithIntl = injectIntl(Vector);


export default connect(MapStateToProps, MapDispatchToProps)(VectorWithIntl);
