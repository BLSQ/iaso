import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import PlanningModaleComponent from '../components/PlanningModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { saveFull, deleteFull } from '../../../utils/saveData';

const baseApiUrl = '/api/plannings/?';


class ManagementPlannings extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: [
                {
                    Header: 'ID',
                    accessor: 'id',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Nom',
                        id: 'main.label.name',
                    }),
                    accessor: 'name',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Année',
                        id: 'main.label.year',
                    }),
                    accessor: 'year',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Date de modification',
                        id: 'main.label.updateDate',
                    }),
                    accessor: 'updated_at',
                    Cell: settings => (
                        <span>{moment(settings.original.updated_at).format('YYYY-MM-DD HH:mm')}</span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.actions',
                    }),
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--edit"
                                onClick={() => this.editPlanning(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                            </button>
                            <button
                                className="button--delete"
                                onClick={() => this.showDelete(settings.original)}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                            </button>
                        </section>
                    ),
                },
            ],
            tableUrl: baseApiUrl,
            showEditModale: false,
            showDeleteModale: false,
            planningEdited: undefined,
            planningDeleted: undefined,
            isUpdating: false,
        };
    }

    componentWillReceiveProps() {
        this.setState({
            tableUrl: baseApiUrl,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('plannings', {
            ...this.props.params,
            [key]: value,
        });
    }

    editPlanning(planning) {
        this.setState({
            showEditModale: true,
            planningEdited: planning,
        });
    }

    showDelete(planning) {
        this.setState({
            showDeleteModale: true,
            planningDeleted: planning,
        });
    }

    toggleEditModale() {
        this.setState({
            showEditModale: !this.state.showEditModale,
            planningEdited:
                !this.state.showEditModale ? this.state.planningEdited : undefined,
        });
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
            planningDeleted:
                !this.state.showDeleteModale ? this.state.planningDeleted : undefined,
        });
    }

    savePlanning(newPlanning) {
        this.setState({
            isUpdating: true,
        });
        saveFull(newPlanning, `/api/plannings/${newPlanning.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    planningEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save planning: ${newPlanning.name}`);
            }
        });
    }

    deletePlanning(planning) {
        this.setState({
            isUpdating: true,
        });
        deleteFull(`/api/plannings/${planning.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showDeleteModale: false,
                    planningDeleted: undefined,
                });
            } else {
                console.error(`One error occured when trying to delete planning: ${planning.name}`);
            }
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <section>

                <PlanningModaleComponent
                    showModale={this.state.showEditModale}
                    toggleModal={() => this.toggleEditModale()}
                    planning={this.state.planningEdited}
                    savePlanning={newPlanning => this.savePlanning(newPlanning)}
                />
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.planningDeleted}
                        deleteElement={planning => this.deletePlanning(planning)}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.coord.title"
                                defaultMessage="Plannings"
                            />
                        </h2>

                    </div>
                </div>
                <div className="widget__container management-control">
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
                            {
                                !this.state.isUpdating &&
                                <CustomTableComponent
                                    isSortable
                                    showPagination
                                    endPointUrl={this.state.tableUrl}
                                    columns={this.state.tableColumns}
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    params={this.props.params}
                                    defaultPath="plannings"
                                />
                            }
                        </div>
                        <div className="widget__content align-right">
                            <button
                                className="button--add"
                                onClick={() => this.editPlanning()}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="main.label.new" defaultMessage="Nouveau" />
                            </button>
                        </div>
                    </section>
                </div>
            </section>);
    }
}

ManagementPlannings.defaultProps = {
};

ManagementPlannings.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const ManagementPlanningsIntl = injectIntl(ManagementPlannings);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementPlanningsIntl);
