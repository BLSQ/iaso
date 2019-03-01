import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl, getRequest } from '../../../utils/fetchData';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { mapActions } from '../redux/mapReducer';

import {
    MESSAGES,
    itemsToShow,
} from '../utlls/vectorMapUtils';

import VectorMapComponent from '../components/VectorMapComponent';
import ClusterSwitchComponent from '../../../components/ClusterSwitchComponent';
import SitesLegendComponent from '../components/SitesLegendComponent';
import RadiosComponent from '../../../components/RadiosComponent';
import LayersComponent from '../../../components/LayersComponent';
import TabsComponent from '../../../components/TabsComponent';
import trapsColumns from '../utlls/trapsColumns';
import sitesColumns from '../utlls/sitesColumns';
import targetsColumns from '../utlls/targetsColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import { filtersVectors, filtersVectors2, filtersVectorsGeo } from '../constants/vectorFilters';
import EditTrapComponent from '../components/EditTrapComponent';
import EditSiteComponent from '../components/sites/EditSiteComponent';
import ShowCatchesComponent from '../components/ShowCatchesComponent';
import EditTargetComponent from '../components/EditTargetComponent';
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
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: props.params.tab,
            sitesColumns: sitesColumns(props.intl.formatMessage, this),
            trapsColumns: trapsColumns(props.intl.formatMessage, MESSAGES, this),
            targetsColumns: targetsColumns(props.intl.formatMessage, this),
            showEditTrapsModale: false,
            showEditSiteModale: false,
            showEditTargetModale: false,
            showCatchesModale: false,
            siteEdited: props.siteEdited,
            trapEdited: props.trapEdited,
            targetEdited: props.targetEdited,
        };
    }

    componentWillReceiveProps(newProps) {
        const newState = {
            ...this.state,
            itemsToShow: itemsToShow(newProps.params),
            sites: [],
            traps: [],
            targets: [],
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: newProps.params.tab,
            siteEdited: newProps.siteEdited || this.state.siteEdited,
            trapEdited: newProps.trapEdited || this.state.trapEdited,
            targetEdited: newProps.targetEdited || this.state.targetEdited,
        };
        if (newProps.params.sites) {
            newState.sites = newProps.vectors.sites;
        }
        if (newProps.params.traps) {
            newState.traps = newProps.vectors.traps;
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

    getDownloadUrl(key, exportFormat = 'csv') {
        const {
            params: {
                dateFrom,
                dateTo,
                orderSites,
                orderTraps,
                orderTargets,
                userId,
                habitats,
                onlyReferenceTraps,
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
        if (onlyReferenceTraps) {
            url += '&onlyReferenceTraps=True';
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
                showEditTrapsModale: false,
                showCatchesModale: false,
                showEditTargetModale: false,
                siteEdited: data,
            });
        }

        if (type === 'trap') {
            this.setState({
                showEditSiteModale: false,
                showEditTrapsModale: true,
                showCatchesModale: false,
                showEditTargetModale: false,
                trapEdited: data,
            });
        }

        if (type === 'target') {
            this.setState({
                showEditSiteModale: false,
                showEditTrapsModale: false,
                showCatchesModale: false,
                showEditTargetModale: true,
                targetEdited: data,
            });
        }
    }

    editSite(data) {
        this.props.getDetail(data.id, 'new_sites').then((res) => {
            const newState = {
                showCatchesModale: false,
                showEditSiteModale: true,
                showEditTrapsModale: false,
                showEditTargetModale: false,
                siteEdited: res,
            };
            this.setState(newState);
        });
    }

    selectResponsible(site, responsibleId) {
        const s = site;
        s.responsible_id = responsibleId;
        this.props.saveSite(s);
    }

    displayCatches(data = undefined, fetchDetails = false) {
        const newState = {
            showCatchesModale: true,
            showEditSiteModale: false,
            showEditTrapsModale: false,
            showEditTargetModale: false,
            trapEdited: data,
        };
        if (!fetchDetails) {
            this.setState(newState);
        } else {
            this.props.getDetail(data.id, 'traps').then((res) => {
                newState.trapEdited = res;
                this.setState(newState);
            });
        }
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
            filters: {
                provinces,
                zones,
                areas,
            },
            params,
            getShape,
            changeLayer,
            changeCluster,
            getDetail,
            redirectTo,
            reduxSitesPage,
            reduxTrapsPage,
            reduxTargetsPage,
            profiles,
            habitats,
            saveSite,
            saveTrap,
            saveTarget,
        } = this.props;
        const {
            currentTab,
            sites,
            traps,
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
                    this.state.showCatchesModale &&
                    <ShowCatchesComponent
                        showModale={this.state.showCatchesModale}
                        toggleModal={() =>
                            this.setState({
                                showCatchesModale: !this.state.showCatchesModale,
                            })}
                        trap={this.state.trapEdited}
                        params={params}
                    />
                }
                {
                    this.state.showEditSiteModale &&
                    <EditSiteComponent
                        showModale={this.state.showEditSiteModale}
                        toggleModal={() =>
                            this.setState({
                                showEditSiteModale: !this.state.showEditSiteModale,
                            })}
                        site={this.state.siteEdited}
                        saveSite={site => saveSite(site)}
                        saveTrap={(trap, selectedValue) => { console.log('selectedValue', selectedValue); const t = trap; t.is_selected = selectedValue; saveTrap(t); }}
                        profiles={profiles}
                    />
                }
                {
                    this.state.showEditTrapsModale &&
                    <EditTrapComponent
                        showModale={this.state.showEditTrapsModale}
                        toggleModal={() =>
                            this.setState({
                                showEditTrapsModale: !this.state.showEditTrapsModale,
                            })}
                        trap={this.state.trapEdited}
                        habitats={habitats}
                        saveTrap={site => saveTrap(site)}
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
                        { label: `${formatMessage(MESSAGES.traps)}`, key: 'traps' },
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
                            {
                                params.traps &&
                                <div className="margin-top">
                                    <ClusterSwitchComponent
                                        withCluster={withCluster}
                                        change={withCl => changeCluster(withCl)}
                                        message={formatMessage(MESSAGES.cluster_title)}
                                    />
                                </div>
                            }
                            {
                                params.traps &&
                                !withCluster &&
                                <div className="margin-top">
                                    <SitesLegendComponent />
                                </div>
                            }
                        </div>
                        <div className="split-map big">
                            <VectorMapComponent
                                baseLayer={baseLayer}
                                sites={sites || []}
                                traps={traps || []}
                                targets={targets || []}
                                endemicVillages={endemicVillages || {}}
                                nonEndemicVillages={nonEndemicVillages || {}}
                                getShape={type => getShape(type)}
                                selectMarker={(itemId, key) => getDetail(itemId, key)}
                                editItem={(type, data) => this.editItem(type, data)}
                                displayCatches={data => this.displayCatches(data)}
                                withCluster={withCluster}
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
            </section>
        );
    }
}
Vector.defaultProps = {
    siteEdited: undefined,
    trapEdited: undefined,
    targetEdited: undefined,
};

Vector.propTypes = {
    getDetail: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    vectors: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    changeCluster: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    reduxSitesPage: PropTypes.object.isRequired,
    reduxTrapsPage: PropTypes.object.isRequired,
    reduxTargetsPage: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    filters: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
    saveTrap: PropTypes.func.isRequired,
    saveTarget: PropTypes.func.isRequired,
    siteEdited: PropTypes.object,
    trapEdited: PropTypes.object,
    targetEdited: PropTypes.object,
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
    profiles: state.vectors.profiles,
    habitats: state.vectors.habitats,
    load: state.load,
    map: state.map,
    reduxSitesPage: state.vectors.sitesPage,
    reduxTrapsPage: state.vectors.trapsPage,
    reduxTargetsPage: state.vectors.targetsPage,
    filters: state.geoFilters,
});
const VectorWithIntl = injectIntl(Vector);


export default connect(MapStateToProps, MapDispatchToProps)(VectorWithIntl);
