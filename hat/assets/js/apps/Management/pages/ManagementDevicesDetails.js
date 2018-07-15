import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
    FormattedMessage,
    injectIntl,
    FormattedDate,
    defineMessages,
} from 'react-intl';

import { devicesActions } from '../redux/devices';
import CustomTableComponent from '../../../components/CustomTableComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { getRequest, createUrl } from '../../../utils/fetchData';
import { formatThousand, getPercentage } from '../../../utils';
import TabsComponent from '../../../components/TabsComponent';
import LayersComponent from '../../../components/LayersComponent';
import { mapActions } from '../redux/mapReducer';
import { Map } from '../components';
import BarChart from '../../../components/BarChart';
import testStatsSettings from '../constants/testStatsSettings';
import confirmationStatsSettings from '../constants/confirmationStatsSettings';
import LoadingSpinner from '../../../components/loading-spinner';


const MESSAGES = defineMessages({
    table: {
        defaultMessage: 'Liste',
        id: 'teamsdevices.label.list',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'teamsdevices.label.map',
    },
    stats: {
        defaultMessage: 'Statistiques',
        id: 'teamsdevices.label.stats',
    },
    testStatsTitle: {
        defaultMessage: 'Nombre de tests',
        id: 'teamsdevices.title.testStatsTitle',
    },
    confirmationStatsTitle: {
        defaultMessage: 'Nombre de confirmations',
        id: 'teamsdevices.title.confirmationStatsTitle',
    },
});

const mapVillages = (allVillages) => {
    const villages = [];
    allVillages.map((village) => {
        if (village.village__id) {
            const tempVillage = {
                latitude: village.village__latitude,
                longitude: village.village__longitude,
                name: village.village__name,
                original: village,
            };
            villages.push(tempVillage);
        }
        return null;
    });
    return villages;
};

const renderTestPourcentage = (total) => {
    const cattPercentage = getPercentage(total.total_catt, total.total_catt_positive);
    const rdtPercentage = getPercentage(total.total_rdt, total.total_rdt_positive);
    return (
        <div className="align-center bold large-text">
            {
                total.total_catt === 0 &&
                <div className="padding-bottom">
                    <FormattedMessage id="teamsdevices.label.noCATT" defaultMessage="Aucun test CATT" />
                </div>
            }
            {
                total.total_catt !== 0 &&
                <div className="padding-bottom">
                    {cattPercentage}% CATT <FormattedMessage id="teamsdevices.label.positive" defaultMessage="Positif" />
                </div>
            }
            {
                total.total_rdt === 0 &&
                <div>
                    <FormattedMessage id="teamsdevices.label.noRDT" defaultMessage="Aucun test RDT" />
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div>
                    {rdtPercentage}% RDT <FormattedMessage id="teamsdevices.label.positive" defaultMessage="Positif" />
                </div>
            }
        </div>);
};

const renderConfirmationPourcentage = (total) => {
    const confirmationPercentage = getPercentage(total.total_confirmation_tests, total.total_confirmation_tests_positive);
    return (
        <div className="align-center bold large-text">
            {
                total.total_confirmation_tests === 0 &&
                <div>
                    <FormattedMessage id="teamsdevices.label.noConfirmation" defaultMessage="Aucun test de confirmation" />
                </div>
            }
            {
                total.total_confirmation_tests !== 0 &&
                <div>
                    {confirmationPercentage}% <FormattedMessage id="teamsdevices.label.positiveConfirmation" defaultMessage="de tests de confirmation positifs" />
                </div>
            }
        </div>);
};


export class ManagementDevicesDetails extends Component {
    constructor(props) {
        super(props);
        const {
            dispatch,
            currentDevice,
            params: {
                id,
                from,
                to,
                teamId,
            },
        } = props;
        if (!currentDevice) {
            dispatch(devicesActions.fetchDevices(dispatch, parseInt(id, 10)));
        } else {
            dispatch(devicesActions.fetchDevicesVillages(dispatch, currentDevice.device_id, from, to, teamId, 'villageyear'));
            dispatch(devicesActions.fetchDevicesVillages(dispatch, currentDevice.device_id, from, to, teamId, 'month'));
        }
        const { formatMessage } = this.props.intl;

        this.state = {
            currentTab: 'table',
            tableColumns:
                [
                    {
                        Header: formatMessage({
                            defaultMessage: 'Village',
                            id: 'teamsdevices.label.village',
                        }),
                        accessor: 'village__name',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Jour',
                            id: 'teamsdevices.label.day',
                        }),
                        accessor: 'date',
                        Cell: settings => (<FormattedDate value={new Date(settings.original.date)} />),
                    },
                    {
                        Header: 'CATT',
                        accessor: 'catt_count',
                    },
                    {
                        Header: 'RDT',
                        accessor: 'rdt_count',
                    },
                    {
                        Header: 'PG',
                        accessor: 'pg_count',
                    },
                    {
                        Header: 'MAECT',
                        accessor: 'ctcwoo_count',
                    },
                    {
                        Header: 'CTCWOO',
                        accessor: 'maect_count',
                    },
                    {
                        Header: 'PL',
                        accessor: 'pl_count',
                    },
                    {
                        Header: 'TOTAL',
                        accessor: 'test_count',
                    },
                ],
        };
    }

    componentWillReceiveProps(newProps) {
        const {
            dispatch,
            villagesYear,
            villagesMonth,
            currentDevice,
            params: {
                from,
                to,
                teamId,
            },
            load: {
                loading,
            },
        } = newProps;

        const fetchVillagesYear = ((!villagesYear.deviceId ||
            from !== this.props.params.from ||
            to !== this.props.params.to ||
            teamId !== this.props.params.teamId) && !loading);

        const fetchVillagesMonth = ((!villagesMonth.deviceId ||
            from !== this.props.params.from ||
            to !== this.props.params.to ||
            teamId !== this.props.params.teamId) && !loading);

        if (fetchVillagesYear) {
            dispatch(devicesActions.fetchDevicesVillages(dispatch, currentDevice.device_id, from, to, teamId, 'villageyear', !fetchVillagesMonth));
        }

        if (fetchVillagesMonth) {
            dispatch(devicesActions.fetchDevicesVillages(dispatch, currentDevice.device_id, from, to, teamId, 'month', true));
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch(devicesActions.resetDevices());
    }

    getVillageTableUrl() {
        const {
            currentDevice,
            params: {
                from,
                to,
                teamId,
            },
        } = this.props;
        let url = `/api/teststats/?device_id=${currentDevice.device_id}&grouping=villageday`;
        if (from) {
            url += `&from=${from}`;
        }
        if (to) {
            url += `&to=${to}`;
        }
        if (teamId) {
            url += `&team_id=${teamId}`;
        }
        return url;
    }

    render() {
        const { baseLayer } = this.props.map;
        const {
            currentDevice,
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
                                currentDevice &&
                                <div>
                                    <FormattedMessage id="teamsdevices.label.user" defaultMessage="Utilisateur" />:{` ${currentDevice.last_user}`}
                                    {' - '}
                                    <FormattedMessage id="teamsdevices.label.team" defaultMessage="Equipe" />:{` ${currentDevice.last_team}`}
                                </div>
                            }
                        </h2>
                    </div>
                </div>

                <div className="widget__container">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <PeriodSelectorComponent
                                dateFrom={params.from}
                                dateTo={params.to}
                                onChangeDate={(from, to) =>
                                    this.props.redirectTo('devices', {
                                        ...params,
                                        from,
                                        to,
                                    })}
                            />
                        </h2>
                    </div>
                </div>
                <TabsComponent
                    defaultPath="devices"
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
                        currentDevice &&
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
                            defaultPath="devices"
                            onRowClicked={() => { }}
                            multiSort
                            onDataLoaded={villagesList => this.props.setVillages(villagesList)}
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
                            !currentDevice) &&
                            <div className="widget__content">
                                {' '}
                            </div>
                    }
                    {
                        !loading &&
                        currentDevice &&
                        villages.length === 0 &&
                        <div className="widget__content">
                            <FormattedMessage
                                id="teamsdevices.label.noresult"
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
                            </div>
                            <div className="split-map ">
                                {
                                    villagesYear.list.length > 0 &&
                                    <Map
                                        baseLayer={baseLayer}
                                        overlays={{ labels: false }}
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
                            !currentDevice) &&
                            <div className="widget__container">
                                <div className="widget__content">
                                    {' '}
                                </div>
                            </div>
                    }

                    {
                        !loading &&
                        currentDevice &&
                        villagesMonth.list.length === 0 &&
                        <div className="widget__container">
                            <div className="widget__content">
                                <FormattedMessage
                                    id="teamsdevices.label.noresult"
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

const ManagementDevicesDetailsWithIntl = injectIntl(ManagementDevicesDetails);


ManagementDevicesDetails.defaultProps = {
    currentDevice: undefined,
};

ManagementDevicesDetails.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    currentDevice: PropTypes.object,
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
};
const MapStateToProps = state => ({
    config: state.config,
    currentDevice: state.devices.current,
    allDevices: state.devices.currentDevice,
    villages: state.devices.villages,
    villagesYear: state.devices.villagesYear,
    villagesMonth: state.devices.villagesMonth,
    map: state.map,
    load: state.load,
});

const getShapePath = (type) => {
    if (type === 'area') { return AREAS_PATH; }
    if (type === 'zone') { return ZONES_PATH; }

    return null;
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setVillages: villageList => dispatch(devicesActions.loadDevicesVillages(villageList)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: type => getRequest(getShapePath(type), dispatch),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesDetailsWithIntl);
