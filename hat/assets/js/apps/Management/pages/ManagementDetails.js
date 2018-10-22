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

import { detailsActions } from '../redux/details';
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
        id: 'details.label.list',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'details.label.map',
    },
    stats: {
        defaultMessage: 'Statistiques',
        id: 'details.label.stats',
    },
    testStatsTitle: {
        defaultMessage: 'Nombre de tests',
        id: 'details.title.testStatsTitle',
    },
    confirmationStatsTitle: {
        defaultMessage: 'Nombre de confirmations',
        id: 'details.title.confirmationStatsTitle',
    },
});

const mapVillages = (allVillages) => {
    const villages = [];
    allVillages.map((village) => {
        if (village.village__id && village.village__latitude && village.village__longitude) {
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
        <div className="align-right bold large-text">
            <div className="padding-bottom">
                {formatThousand(total.total_catt)} <FormattedMessage id="details.label.totalCatt" defaultMessage="test(s) CATT effectué(s)" />
            </div>
            {
                total.total_catt === 0 &&
                <div className="padding-bottom">
                    <FormattedMessage id="details.label.noCATT" defaultMessage="Aucun test CATT" />
                </div>
            }
            {
                total.total_catt !== 0 &&
                <div className="padding-bottom">
                    {cattPercentage}% CATT <FormattedMessage id="details.label.positive" defaultMessage="Positif" />
                </div>
            }
            <div className="padding-bottom">
                {formatThousand(total.total_rdt)} <FormattedMessage id="details.label.totalRdt" defaultMessage="test(s) RDT effectué(s)" />
            </div>
            {
                total.total_rdt === 0 &&
                <div>
                    <FormattedMessage id="details.label.noRDT" defaultMessage="Aucun test RDT" />
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div>
                    {rdtPercentage}% RDT <FormattedMessage id="details.label.positive" defaultMessage="Positif" />
                </div>
            }
        </div>);
};

const renderConfirmationPourcentage = (total) => {
    const confirmationPercentage = getPercentage(total.total_confirmation_tests, total.total_confirmation_tests_positive);
    return (
        <div className="align-right bold large-text">
            <div className="padding-bottom">
                {formatThousand(total.total_catt_positive + total.total_rdt_positive)} <FormattedMessage id="details.label.suspect" defaultMessage="test(s) suspects" />
            </div>
            <div className="padding-bottom">
                {formatThousand(total.total_confirmation_tests)} <FormattedMessage id="details.label.total_confirmation_tests" defaultMessage="test(s) de confirmation" />
            </div>
            {
                total.total_confirmation_tests === 0 &&
                <div>
                    <FormattedMessage id="details.label.noConfirmation" defaultMessage="Aucun test de confirmation" />
                </div>
            }
            {
                total.total_confirmation_tests !== 0 &&
                <div>
                    {confirmationPercentage}% <FormattedMessage id="details.label.positiveConfirmation" defaultMessage="de tests de confirmation positif" />
                </div>
            }
        </div>);
};
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
            tableColumns:
                [
                    {
                        Header: formatMessage({
                            defaultMessage: 'Village',
                            id: 'details.label.village',
                        }),
                        accessor: 'village__name',
                        Footer: formatMessage({
                            defaultMessage: 'TOTAL',
                            id: 'details.label.total',
                        }),
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Jour',
                            id: 'details.label.day',
                        }),
                        accessor: 'date',
                        Cell: settings => (<FormattedDate value={new Date(settings.original.date)} />),
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Dépistages',
                            id: 'details.label.screenings',
                        }),
                        columns: [
                            {
                                Header: 'CATT',
                                accessor: 'catt_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_catt : ''),
                            },
                            {
                                Header: 'RDT',
                                accessor: 'rdt_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_rdt : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'Positifs',
                                    id: 'details.label.positive',
                                }),
                                accessor: 'positive_screening_test_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_catt_positive + tableTotal.total_rdt_positive : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'TOTAL',
                                    id: 'details.label.total',
                                }),
                                accessor: 'screening_count',
                                className: 'small',
                                width: 120,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_catt + tableTotal.total_rdt : ''),
                            },
                        ],
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Confirmations',
                            id: 'details.label.confirmations',
                        }),
                        columns: [
                            {
                                Header: 'PG',
                                accessor: 'pg_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_pg : ''),
                            },
                            {
                                Header: 'CTCWOO',
                                accessor: 'ctcwoo_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_ctc : ''),
                            },
                            {
                                Header: 'MAECT',
                                accessor: 'maect_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_maect : ''),
                            },
                            {
                                Header: 'PL',
                                accessor: 'pl_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_pl : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'Positifs',
                                    id: 'details.label.positive',
                                }),
                                accessor: 'positive_confirmation_test_count',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_confirmation_tests_positive : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'TOTAL',
                                    id: 'details.label.total',
                                }),
                                accessor: 'confirmation_count',
                                className: 'small',
                                width: 120,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_confirmation_tests : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'Stade 1',
                                    id: 'details.label.pl_count_stage1',
                                }),
                                accessor: 'pl_count_stage1',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_pl_stage1 : ''),
                            },
                            {
                                Header: formatMessage({
                                    defaultMessage: 'Stade 2',
                                    id: 'details.label.pl_count_stage2',
                                }),
                                accessor: 'pl_count_stage2',
                                className: 'small',
                                width: 100,
                                resizable: false,
                                Footer: () => (tableTotal ? tableTotal.total_pl_stage2 : ''),
                            },
                        ],
                    },
                ],
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
            dispatch(detailsActions.fetchDetailsVillages(dispatch, currentDetail.device_id ? 'device_id' : 'team_id', currentDetail.device_id ? currentDetail.device_id : currentDetail.id, from, to, 'villageyear', !fetchVillagesMonth));
        }

        if (fetchVillagesMonth) {
            dispatch(detailsActions.fetchDetailsVillages(dispatch, currentDetail.device_id ? 'device_id' : 'team_id', currentDetail.device_id ? currentDetail.device_id : currentDetail.id, from, to, 'month', true));
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
        let url = currentDetail.device_id ? `/api/teststats/?device_id=${currentDetail.device_id}&grouping=villageday` : `/api/teststats/?team_id=${currentDetail.id}&grouping=villageday`;
        if (from) {
            url += `&from=${from}`;
        }
        if (to) {
            url += `&to=${to}`;
        }
        return url;
    }

    render() {
        console.log(tableTotal);
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
                                    <div>
                                        <FormattedMessage id="details.label.user" defaultMessage="Utilisateur" />:{` ${currentDetail.last_user}`}
                                        {' - '}
                                        <FormattedMessage id="details.label.team" defaultMessage="Equipe" />:{` ${currentDetail.last_team}`}
                                    </div>
                                }
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
    currentTeam: undefined,
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

const getShapePath = (type) => {
    if (type === 'area') { return AREAS_PATH; }
    if (type === 'zone') { return ZONES_PATH; }

    return null;
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setVillages: villageList => dispatch(detailsActions.loadDetailsVillages(villageList)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: type => getRequest(getShapePath(type), dispatch),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDetailsWithIntl);
