import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
} from 'react-intl';

import { detailsActions } from '../../redux/details';
import CustomTableComponent from '../../../../components/CustomTableComponent';
import PeriodSelectorComponent from '../../../../components/PeriodSelectorComponent';
import { getRequest, createUrl } from '../../../../utils/fetchData';
import { formatThousand } from '../../../../utils';
import TabsComponent from '../../../../components/TabsComponent';
import LayersComponent from '../../../../components/LayersComponent';
import { mapActions } from '../../redux/mapReducer';
import { Map } from '../../components';
import BarChart from '../../../../components/BarChart';
import testStatsSettings from '../../constants/testStatsSettings';
import confirmationStatsSettings from '../../constants/confirmationStatsSettings';
import LoadingSpinner from '../../../../components/loading-spinner';
import managementDetailColumns from '../../constants/managementDetailColumns';
import {
    MESSAGES,
    mapVillages,
    renderTestPourcentage,
    renderConfirmationPourcentage,
} from './utils';

let tableTotal;

export class ManagementDetails extends Component {
    constructor(props) {
        super(props);
        const {
            dispatch,
            params: {
                deviceId,
                teamId,
            },
        } = props;

        if (deviceId) {
            dispatch(detailsActions.fetchDetails(dispatch, parseInt(deviceId, 10), `/api/devices/${deviceId}`));
        }
        if (teamId) {
            dispatch(detailsActions.fetchDetails(dispatch, parseInt(teamId, 10), `/api/teams/${teamId}`));
        }

        const { formatMessage } = this.props.intl;

        this.state = {
            currentTab: 'table',
            tableColumns: managementDetailColumns(formatMessage, tableTotal),
            isTest: false,
        };
    }

    componentWillReceiveProps(newProps) {
        const {
            dispatch,
            villagesYear,
            villagesMonth,
            currentDetail,
            params: {
                from,
                to,
                deviceId,
            },
            load: {
                loading,
            },
        } = newProps;

        const fetchVillagesYear = ((!villagesYear.detailId ||
            from !== this.props.params.from ||
            to !== this.props.params.to) && !loading);

        const fetchVillagesMonth = ((!villagesMonth.detailId ||
            from !== this.props.params.from ||
            to !== this.props.params.to) && !loading);
        if (fetchVillagesYear) {
            dispatch(detailsActions.fetchDetailsVillages(dispatch, currentDetail.device_id ?
                'device_id' : 'team_id', currentDetail.device_id ?
                currentDetail.device_id : currentDetail.id, from, to, 'villageyear', !fetchVillagesMonth));
        }

        if (fetchVillagesMonth) {
            dispatch(detailsActions.fetchDetailsVillages(dispatch, currentDetail.device_id ?
                'device_id' : 'team_id', currentDetail.device_id ?
                currentDetail.device_id : currentDetail.id, from, to, 'month', true));
        }
        if (deviceId && currentDetail) {
            this.setState({
                isTest: currentDetail.is_test,
            });
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch(detailsActions.resetDetails());
    }

    onTableLoaded(datas) {
        tableTotal = datas.total;
        this.props.setVillages(datas.result);
    }

    getVillageTableUrl() {
        const {
            currentDetail,
            params: {
                from,
                to,
            },
        } = this.props;
        let url = currentDetail.device_id ?
            `/api/teststats/?device_id=${currentDetail.device_id}&grouping=villageday` :
            `/api/teststats/?team_id=${currentDetail.id}&grouping=villageday`;
        if (from) {
            url += `&from=${from}`;
        }
        if (to) {
            url += `&to=${to}`;
        }
        return url;
    }

    saveDeviceChanges() {
        const { isTest } = this.state;
        const newDevice = {
            ...this.props.currentDetail,
            is_test: isTest,
        };
        this.props.saveDevice(newDevice);
    }

    render() {
        const { baseLayer } = this.props.map;
        const {
            currentDetail,
            villages,
            villagesYear,
            villagesMonth,
            params,
            load: {
                loading,
            },
        } = this.props;
        const { formatMessage } = this.props.intl;
        return (
            <section>
                {
                    loading &&
                    <div>
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    </div>
                }
                <div className="widget__container">
                    {
                        currentDetail &&
                        currentDetail.device_id &&
                        <div className="widget__header">
                            <h2>
                                <button
                                    className="button--back"
                                    onClick={() => (this.props.redirectTo('devices', {
                                        order: params.deviceOrder,
                                    }))}
                                >
                                    <i className="fa fa-arrow-left" />{' '}
                                </button>

                                {
                                    currentDetail &&
                                    <span>
                                        <FormattedMessage id="details.label.user" defaultMessage="Utilisateur" />:{` ${currentDetail.last_user}`}
                                        {' - '}
                                        <FormattedMessage id="details.label.team" defaultMessage="Equipe" />:{` ${currentDetail.last_team}`}
                                    </span>
                                }
                                <div className="float-right">
                                    <span className="filter-checkbox">
                                        <label htmlFor="checkbox-is-test">
                                            <FormattedMessage id="details.label.is_test" defaultMessage="Tablette de test" />:
                                        </label>
                                        <input
                                            id="checkbox-is-test"
                                            type="checkbox"
                                            name="checkbox-is-test"
                                            className="list--normalized-as-checkbox"
                                            checked={
                                                this.state.isTest ? 'checked' : ''
                                            }
                                            onChange={event => this.setState({ isTest: event.target.checked })}
                                        />
                                    </span>
                                    <button
                                        disabled={currentDetail.is_test === this.state.isTest}
                                        onClick={() => this.saveDeviceChanges()}
                                        className="button--save--tiny margin-left"
                                    >
                                        <FormattedMessage
                                            id="details.label.save"
                                            defaultMessage="Sauver"
                                        />
                                    </button>
                                </div>
                            </h2>
                        </div>
                    }
                    {
                        currentDetail &&
                        currentDetail.name &&
                        <div className="widget__header">
                            <h2>
                                <button
                                    className="button--back"
                                    onClick={() => (this.props.redirectTo('teams', {
                                        coordination_id: params.coordination_id,
                                        type: params.type,
                                        order: params.teamOrder,
                                    }))}
                                >
                                    <i className="fa fa-arrow-left" />{' '}
                                </button>

                                {
                                    currentDetail &&
                                    <div>
                                        <FormattedMessage id="details.label.team" defaultMessage="Equipe" />:{` ${currentDetail.name}`}
                                    </div>
                                }
                            </h2>
                        </div>
                    }
                </div>

                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <PeriodSelectorComponent
                                dateFrom={params.from}
                                dateTo={params.to}
                                onChangeDate={(from, to) =>
                                    this.props.redirectTo('detail', {
                                        ...params,
                                        from,
                                        to,
                                    })}
                            />
                        </h2>
                    </div>
                </div>
                <TabsComponent
                    defaultPath="detail"
                    params={params}
                    selectTab={key => (this.setState({ currentTab: key }))}
                    tabs={[
                        { label: formatMessage(MESSAGES.table), key: 'table' },
                        { label: formatMessage(MESSAGES.map), key: 'map' },
                        { label: formatMessage(MESSAGES.stats), key: 'stats' },
                    ]}
                    defaultSelect={this.state.currentTab}
                />
                <div className={`widget__container no-border ${this.state.currentTab !== 'table' ? 'hidden' : ''}`}>
                    {
                        currentDetail &&
                        villages &&
                        <CustomTableComponent
                            selectable
                            isSortable
                            dataKey="result"
                            showPagination={false}
                            endPointUrl={this.getVillageTableUrl()}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'date', desc: false }]}
                            params={this.props.params}
                            defaultPath="detail"
                            onRowClicked={() => { }}
                            multiSort
                            callBackWithDataKey={false}
                            onDataLoaded={result => this.onTableLoaded(result)}
                        />
                    }
                    <div className="count-container-alone">
                        <div>
                            {`${formatThousand(villages.length)} `}
                            <FormattedMessage
                                id="locator.list.result"
                                defaultMessage="résultat(s)"
                            />
                        </div>
                    </div>
                </div>
                <div className={`widget__container ${this.state.currentTab !== 'map' ? 'hidden' : ''}`}>
                    {
                        (loading ||
                            !currentDetail) &&
                            <div className="widget__content">
                                {' '}
                            </div>
                    }
                    {
                        !loading &&
                        currentDetail &&
                        villages.length === 0 &&
                        <div className="widget__content">
                            <FormattedMessage
                                id="details.label.noresult"
                                defaultMessage="Aucun résultat"
                            />
                        </div>
                    }
                    {villages.length > 0 &&
                        <div className="flex-container">
                            <div className="split-selector-container ">
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => this.props.changeLayer(type, key)}
                                />
                                <div className="map__option padding-top">
                                    <span className="map__option__header">
                                        <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                    </span>
                                    <form>
                                        <ul className="map__option__list legend">
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--without-positive-cases" />
                                                <FormattedMessage id="management.detail.legend.noNewCases" defaultMessage="Sans nouveau cas" />
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--with-positive-cases" />
                                                <FormattedMessage id="management.detail.legend.newCases" defaultMessage="Avec nouveaux cas" />
                                            </li>
                                        </ul>
                                    </form>
                                </div>
                            </div>
                            <div className="split-map ">
                                {
                                    villagesYear.list.length > 0 &&
                                    <Map
                                        baseLayer={baseLayer}
                                        villages={mapVillages(villagesYear.list)}
                                        selectVillage={() => { }}
                                        selectedVillageId={0}
                                        getShape={type => this.props.getShape(type)}
                                    />
                                }
                            </div>
                        </div>
                    }
                </div>
                <section className={`${this.state.currentTab !== 'stats' ? 'hidden' : ''}`}>
                    {
                        (loading ||
                            !currentDetail) &&
                            <div className="widget__container">
                                <div className="widget__content">
                                    {' '}
                                </div>
                            </div>
                    }

                    {
                        !loading &&
                        currentDetail &&
                        villagesMonth.list.length === 0 &&
                        <div className="widget__container">
                            <div className="widget__content">
                                <FormattedMessage
                                    id="details.label.noresult"
                                    defaultMessage="Aucun résultat"
                                />
                            </div>
                        </div>
                    }
                    {
                        villagesMonth.list.length > 0 &&
                        <section>
                            <div className="widget__container">
                                <BarChart
                                    showLegend
                                    datas={villagesMonth.list}
                                    settings={testStatsSettings}
                                    title={formatMessage(MESSAGES.testStatsTitle)}
                                    extraComponent={renderTestPourcentage(villagesMonth.total)}
                                />
                            </div>
                            <div className="widget__container">
                                <BarChart
                                    showLegend
                                    datas={villagesMonth.list}
                                    settings={confirmationStatsSettings}
                                    title={formatMessage(MESSAGES.confirmationStatsTitle)}
                                    extraComponent={renderConfirmationPourcentage(villagesMonth.total)}
                                />
                            </div>
                        </section>
                    }
                </section>
            </section>
        );
    }
}

const ManagementDetailsWithIntl = injectIntl(ManagementDetails);


ManagementDetails.defaultProps = {
    currentDetail: undefined,
};

ManagementDetails.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    currentDetail: PropTypes.object,
    intl: PropTypes.object.isRequired,
    villages: PropTypes.array.isRequired,
    villagesYear: PropTypes.object.isRequired,
    villagesMonth: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    setVillages: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    load: PropTypes.object.isRequired,
    saveDevice: PropTypes.func.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    currentDetail: state.details.current,
    villages: state.details.villages,
    villagesYear: state.details.villagesYear,
    villagesMonth: state.details.villagesMonth,
    map: state.map,
    load: state.load,
});


const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setVillages: villageList => dispatch(detailsActions.loadDetailsVillages(villageList)),
    saveDevice: device => dispatch(detailsActions.saveDevice(dispatch, device)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: url => getRequest(url, dispatch, null, false),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDetailsWithIntl);
