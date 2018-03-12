import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl, getRequest } from '../../../utils/fetchData';

const baseApiUrl = '/api/qccheckstats/';


const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'Toutes',
        id: 'microplanning.all',
    },
    allMale: {
        defaultMessage: 'Tous',
        id: 'microplanning.allMale',
    },
});

class QualityStats extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        let newUrl = `${baseApiUrl}?date_from=${props.params.date_from}&date_to=${props.params.date_to}`;
        if (props.params.coordination_id) {
            newUrl = `${newUrl}&coordination=${props.params.coordination_id}`;
        }
        this.state = {
            tableColumns: [
                {
                    Header: formatMessage({
                        defaultMessage: 'Equipes',
                        id: 'main.teams',
                    }),
                    columns: [
                        {
                            Header: 'ID',
                            accessor: 'id',
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'Nom',
                                id: 'main.name',
                            }),
                            accessor: 'name',
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'Type',
                                id: 'main.Type',
                            }),
                            accessor: 'UM',
                            Cell: settings => (
                                <span>{settings.original.UM ? 'UM' : 'MUM'}</span>
                            ),
                        },
                    ],
                },
                {
                    Header: 'CATT',
                    accessor: 'CATT',
                    columns: [
                        {
                            Header: formatMessage({
                                defaultMessage: 'à vérifier',
                                id: 'quality.label.tockeck',
                            }),
                            accessor: 'CATT.test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'vérifiées',
                                id: 'quality.label.checked',
                            }),
                            accessor: 'CATT.checked_test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'confirmations',
                                id: 'quality.label.matchCount',
                            }),
                            accessor: 'CATT.match_count',
                            sortable: false,
                            resizable: false,
                        },
                    ],
                },
                {
                    Header: 'RDT',
                    accessor: 'RDT',
                    columns: [
                        {
                            Header: formatMessage({
                                defaultMessage: 'à vérifier',
                                id: 'quality.label.tockeck',
                            }),
                            accessor: 'RDT.test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'vérifiées',
                                id: 'quality.label.checked',
                            }),
                            accessor: 'RDT.checked_test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'confirmations',
                                id: 'quality.label.matchCount',
                            }),
                            accessor: 'RDT.match_count',
                            sortable: false,
                            resizable: false,
                        },
                    ],
                },
                {
                    Header: 'PG',
                    accessor: 'PG',
                    columns: [
                        {
                            Header: formatMessage({
                                defaultMessage: 'à vérifier',
                                id: 'quality.label.tockeck',
                            }),
                            accessor: 'PG.test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'vérifiées',
                                id: 'quality.label.checked',
                            }),
                            accessor: 'PG.checked_test_count',
                            sortable: false,
                            resizable: false,
                        },
                        {
                            Header: formatMessage({
                                defaultMessage: 'confirmations',
                                id: 'quality.label.matchCount',
                            }),
                            accessor: 'PG.match_count',
                            sortable: false,
                            resizable: false,
                        },
                    ],
                },
            ],
            tableUrl: newUrl,
            coordinations: null,
        };
    }
    componentDidMount() {
        this.fetchCoordinations();
    }

    componentWillReceiveProps(newProps) {
        let newUrl = `${baseApiUrl}?date_from=${newProps.params.date_from}&date_to=${newProps.params.date_to}`;
        if (newProps.params.coordination_id) {
            newUrl = `${newUrl}&coordination=${newProps.params.coordination_id}`;
        }
        if (newProps.params.type) {
            newUrl = `${newUrl}&type=${newProps.params.type}`;
        }
        this.setState({
            tableUrl: newUrl,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('stats', {
            ...this.props.params,
            [key]: value,
        });
    }

    fetchCoordinations() {
        const { dispatch } = this.props;
        getRequest('/api/coordinations/', dispatch).then((coordinations) => {
            this.setState({
                coordinations,
            });
        });
    }

    render() {
        const { loading, error } = this.props.load;
        const { formatMessage } = this.props.intl;

        return (
            <section>
                <div className="widget__container quality-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <button
                                className="button--small"
                                onClick={() =>
                                    this.props.redirectTo('', {
                                        date_from: this.props.params.date_from,
                                        date_to: this.props.params.date_to,
                                    })}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>

                            <FormattedMessage
                                id="quality.stats.title"
                                defaultMessage="Statistiques"
                            />
                            <PeriodSelectorComponent
                                dateFrom={this.props.params.date_from}
                                dateTo={this.props.params.date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo('stats', {
                                        ...this.props.params,
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>

                    </div>
                    <div className="widget__content--tier">
                        <div>
                            <FormattedMessage id="microplanning.label.coordination" defaultMessage="Coordination: " />
                            {
                                this.state.coordinations &&
                                <Select
                                    simpleValue
                                    name="coordination_id"
                                    value={parseInt(this.props.params.coordination_id, 10)}
                                    placeholder={formatMessage(MESSAGES.all)}
                                    options={this.state.coordinations.map(coordination =>
                                        ({ label: coordination.name, value: coordination.id }))}
                                    onChange={coordinationId => this.onChangeFilters('coordination_id', coordinationId)}
                                />
                            }
                        </div>
                        <div>
                            <FormattedMessage id="quality.teamType" defaultMessage="Type d'équipe: " />
                            <Select
                                simpleValue
                                name="coordination_id"
                                value={this.props.params.type}
                                placeholder={formatMessage(MESSAGES.allMale)}
                                options={[
                                    { label: 'UM', value: 'UM' },
                                    { label: 'MUM', value: 'MUM' },
                                ]}
                                onChange={typeId => this.onChangeFilters('type', typeId)}
                            />
                        </div>
                    </div>
                </div>
                <div className="widget__container quality-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    }
                    <section>
                        <div className="widget__content">
                            <CustomTableComponent
                                // isFilterable
                                isSortable
                                showPagination
                                endPointUrl={this.state.tableUrl}
                                onRowClicked={(item) => {
                                    console.log(item);
                                }}
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'id', desc: false }]}
                                params={this.props.params}
                                defaultPath="stats"
                            />
                        </div>
                    </section>
                </div>
            </section>);
    }
}

QualityStats.defaultProps = {
};

QualityStats.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const QualityStatsIntl = injectIntl(QualityStats);

const MapStateToProps = state => ({
    load: state.load,
    videoList: state.videoList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityStatsIntl);
