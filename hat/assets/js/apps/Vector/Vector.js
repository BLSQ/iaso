import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl, getRequest } from '../../utils/fetchData';
import PeriodSelectorComponent from '../../components/PeriodSelectorComponent';
import { mapActions } from './redux/mapReducer';


import VectorMapComponent from './components/VectorMapComponent';
import RadiosComponent from '../../components/RadiosComponent';
import LayersComponent from '../../components/LayersComponent';

const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
    },
});

export class Vector extends Component {
    constructor(props) {
        super(props);

        this.state = {
            itemsToShow: [
                {
                    id: 'traps',
                    defaultMessage: 'Traps',
                    isActive: true,
                    iconClass: 'map__option__icon--traps',
                },
                {
                    id: 'targets',
                    defaultMessage: 'Targets',
                    isActive: false,
                    iconClass: 'map__option__icon--targets',
                },
                {
                    id: 'villagesNoneCase',
                    defaultMessage: 'Villages non endémiques',
                    isActive: false,
                    iconClass: 'map__option__icon--villages',
                },
                {
                    id: 'villages',
                    defaultMessage: 'Villages endémiques',
                    isActive: false,
                    iconClass: 'map__option__icon--villages-with-case',
                },
            ],
            traps: props.vectors.traps,
            targets: props.vectors.targets,
            villages: props.vectors.villages,
        };
    }

    componentWillReceiveProps(newProps) {
        if ((newProps.vectors.traps.length !== this.state.traps.length) &&
            this.state.itemsToShow[0].isActive) {
            this.setState({
                traps: newProps.vectors.traps,
            });
        }
        if ((newProps.vectors.targets.length !== this.state.targets.length) &&
            this.state.itemsToShow[1].isActive) {
            this.setState({
                targets: newProps.vectors.targets,
            });
        }
        if ((Object.keys(newProps.vectors.villages).length !==
            Object.keys(this.state.villages).length) &&
            (this.state.itemsToShow[2].isActive || this.state.itemsToShow[3].isActive)) {
            this.setState({
                villages: newProps.vectors.villages,
            });
        }

        if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.showItems(this.state.itemsToShow, newProps.params.zs_id);
        }

        if ((newProps.params.date_from !== this.props.params.date_from) ||
            (newProps.params.date_to !== this.props.params.date_to)) {
            this.showItems(this.state.itemsToShow);
        }
    }

    showItems(itemsToShow, zsId = this.props.params.zs_id) {
        this.setState({
            itemsToShow,
        });
        if (itemsToShow[0].isActive) {
            this.props.fetchTraps();
        } else {
            this.setState({
                traps: [],
            });
        }
        if (itemsToShow[1].isActive) {
            this.props.fetchTargets();
        } else {
            this.setState({
                targets: [],
            });
        }
        if (itemsToShow[2].isActive || itemsToShow[3].isActive) {
            this.props.fetchVillages(itemsToShow[2].isActive, itemsToShow[3].isActive, zsId);
        } else {
            this.setState({
                villages: {},
            });
        }
    }

    render() {
        const { baseLayer } = this.props.map;
        const zsId = this.props.params.zs_id;
        const overlays = { labels: false };
        const { formatMessage } = this.props.intl;
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
                            <PeriodSelectorComponent
                                dateFrom={this.props.params.date_from}
                                dateTo={this.props.params.date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo('', {
                                        ...this.props.params,
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                    </div>
                    <div className="widget__content--tier">
                        <RadiosComponent
                            showItems={items => this.showItems(items)}
                            items={this.state.itemsToShow}
                        />
                        <div>
                            <LayersComponent
                                base={baseLayer}
                                change={(type, key) => this.props.changeLayer(type, key)}
                            />
                        </div>
                        {
                            this.props.vectors.locations &&
                            (this.state.itemsToShow[2].isActive ||
                                this.state.itemsToShow[3].isActive) &&
                                <div className="map__header--filters">
                                    <div className="map__filters">
                                        <div className="map__filters--option">
                                            <span className="map__text--select">
                                                <FormattedMessage
                                                    id="microplanning.filter.zones"
                                                    defaultMessage="Zones de santé"
                                                />
                                            </span>
                                            <Select
                                                multi
                                                simpleValue
                                                autosize={false}
                                                name="zs_id"
                                                value={zsId ? zsId.split(',').map(zs => parseInt(zs, 10)) : ''}
                                                placeholder={formatMessage(MESSAGES['location-all'])}
                                                options={this.props.vectors.locations.map(zs =>
                                                    ({ label: zs.name, value: zs.id }))}
                                                onChange={newZsId =>
                                                    this.props.redirectTo('', {
                                                        ...this.props.params,
                                                        zs_id: newZsId,
                                                    })}
                                            />
                                        </div>
                                    </div>
                                </div>
                        }
                    </div>
                </div>
                <div className="vector-map widget__container">
                    <VectorMapComponent
                        baseLayer={baseLayer}
                        overlays={overlays}
                        traps={this.state.traps}
                        targets={this.state.targets}
                        villages={this.state.villages}
                        getShape={type => this.props.getShape(type)}
                        selectMarker={(itemId, key) => this.props.selectMarker(itemId, key)}
                    />
                </div>
            </section>
        );
    }
}

Vector.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    fetchTraps: PropTypes.func.isRequired,
    fetchTargets: PropTypes.func.isRequired,
    fetchVillages: PropTypes.func.isRequired,
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
    getShape: type => getRequest(`/static/json/${type}s.json`, dispatch),
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
