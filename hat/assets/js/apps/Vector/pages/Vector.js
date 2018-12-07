import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl, getRequest } from '../../../utils/fetchData';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { mapActions } from '../redux/mapReducer';


import VectorMapComponent from '../components/VectorMapComponent';
import RadiosComponent from '../../../components/RadiosComponent';
import LayersComponent from '../../../components/LayersComponent';
import TabsComponent from '../../../components/TabsComponent';
import sitesColumns from '../utlls/sitesColumns';
import targetsColumns from '../utlls/targetsColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';


const MESSAGES = defineMessages({
    map: {
        defaultMessage: 'Carte',
        id: 'details.label.map',
    },
    sites: {
        defaultMessage: 'Pièges',
        id: 'details.label.sites',
    },
    targets: {
        defaultMessage: 'Ecrans',
        id: 'details.label.targets',
    },
});

const itemsToShow = params => [
    {
        id: 'sites',
        defaultMessage: 'Pièges',
        isActive: params.sites === 'true',
        iconClass: 'map__option__icon--sites',
    },
    {
        id: 'targets',
        defaultMessage: 'Ecrans',
        isActive: params.targets === 'true',
        iconClass: 'map__option__icon--targets',
    },
    {
        id: 'nonEndemicVillages',
        defaultMessage: 'Villages non endémiques',
        isActive: params.nonEndemicVillages === 'true',
        iconClass: 'map__option__icon--villages',
    },
    {
        id: 'endemicVillages',
        defaultMessage: 'Villages endémiques',
        isActive: params.endemicVillages === 'true',
        iconClass: 'map__option__icon--villages-with-case',
    },
];

export class Vector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsToShow: itemsToShow(props.params),
            sites: [],
            targets: [],
            nonEndemicVillages: {},
            endemicVillages: {},
            currentTab: props.params.tab || 'map',
            sitesColumns: sitesColumns(props.intl.formatMessage),
            targetsColumns: targetsColumns(props.intl.formatMessage),
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
        this.props.redirectTo('map', tempParams);
    }

    render() {
        const {
            map: {
                baseLayer,
            },
            intl: {
                formatMessage,
            },
            params,
            getShape,
            changeLayer,
            selectMarker,
            redirectTo,
        } = this.props;
        const {
            currentTab,
            sites,
            targets,
            nonEndemicVillages,
            endemicVillages,
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
                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="vector.title" defaultMessage="Vector control: " />
                            {' '}
                            <PeriodSelectorComponent
                                dateFrom={params.date_from}
                                dateTo={params.date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    redirectTo('map', {
                                        ...params,
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                    </div>
                    <div className="widget__content--tier">
                        <div>
                            truc
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                        </div>
                    </div>
                </div>
                <TabsComponent
                    defaultPath="map"
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.map), key: 'map' },
                        { label: formatMessage(MESSAGES.sites), key: 'sites' },
                        { label: formatMessage(MESSAGES.targets), key: 'targets' },
                    ]}
                    defaultSelect={currentTab}
                />
                <div className={`vector-map widget__container ${currentTab === 'map' ? '' : 'hidden-opacity'}`}>
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
                            />
                        </div>
                    </div>
                </div>
                <div className={`widget__container ${currentTab === 'sites' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination={false}
                        endPointUrl={`/api/sites?from=${params.date_from}&to=${params.date_to}`}
                        columns={this.state.sitesColumns}
                        defaultSorted={[{ id: 'id', desc: false }]}
                        params={params}
                        pageSize={50}
                        defaultPath="map"
                        onRowClicked={() => { }}
                        multiSort
                        onDataLoaded={() => { }}
                    />·
                </div>
                <div className={`widget__container ${currentTab === 'targets' ? '' : 'hidden'}`}>
                    <CustomTableComponent
                        isSortable
                        showPagination={false}
                        endPointUrl={`/api/targets?from=${params.date_from}&to=${params.date_to}`}
                        columns={this.state.targetsColumns}
                        defaultSorted={[{ id: 'id', desc: false }]}
                        params={params}
                        defaultPath="map"
                        pageSize={50}
                        onRowClicked={() => { }}
                        multiSort
                        onDataLoaded={() => { }}
                    />·
                </div>
            </section>
        );
    }
}

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
};

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    getShape: url => getRequest(url, dispatch, null, false),
    selectMarker: (itemId, key) => getRequest(`/api/${key}/${itemId}`, dispatch),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
});

const MapStateToProps = state => ({
    vectors: state.vectors,
    load: state.load,
    map: state.map,
});
const VectorWithIntl = injectIntl(Vector);


export default connect(MapStateToProps, MapDispatchToProps)(VectorWithIntl);
