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
import { saveFull, deleteFull, saveDuplicatePlanning } from '../../../utils/saveData';

const baseApiUrl = '/api/plannings/?with_template=True';


class ManagementPlannings extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: [
                {
                    Header: formatMessage({
                        defaultMessage: 'Name',
                        id: 'main.label.name',
                    }),
                    accessor: 'name',
                    Cell: settings => (
                        <span
                            className={`${settings.original.is_template ? 'template' : ''}`}
                        >
                            <span>
                                {`${settings.original.is_template ? `${formatMessage({
                                    defaultMessage: 'Template',
                                    id: 'main.label.template',
                                })}: ` : ''}`}{settings.original.name}
                            </span>
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Année',
                        id: 'main.label.year',
                    }),
                    accessor: 'year',
                    Cell: settings => (
                        <span className={`${settings.original.is_template ? 'template' : ''}`}><span>{!settings.original.is_template ? settings.original.year : '--'}</span></span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Update date',
                        id: 'main.label.updateDate',
                    }),
                    accessor: 'updated_at',
                    Cell: settings => (
                        <span className={`${settings.original.is_template ? 'template' : ''}`}><span>{moment(settings.original.updated_at).format('YYYY-MM-DD HH:mm')}</span></span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.label.actions',
                    }),
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section className={`${settings.original.is_template ? 'template' : ''}`}>
                            <span>
                                <button
                                    className="button--edit--tiny margin-right"
                                    onClick={() => this.editPlanning(settings.original, true)}
                                >
                                    <i className="fa fa-files-o" />
                                    <FormattedMessage id="main.label.duplicate" defaultMessage="Copy" />
                                </button>
                                {
                                    (!settings.original.is_template ||
                                    (settings.original.is_template && this.state.canMakeTemplate)) &&
                                    <span>
                                        <button
                                            className="button--edit--tiny margin-right"
                                            onClick={() => this.editPlanning(settings.original)}
                                        >
                                            <i className="fa fa-pencil-square-o" />
                                            <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                                        </button>
                                    </span>
                                }
                                {
                                    (!settings.original.is_template ||
                                    (settings.original.is_template && this.state.canMakeTemplate)) &&
                                    <span>
                                        <button
                                            className="button--delete--tiny"
                                            onClick={() => this.showDelete(settings.original)}
                                        >
                                            <i className="fa fa-trash" />
                                            <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
                                        </button>
                                    </span>
                                }
                            </span>
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
            isDuplicate: false,
            canMakeTemplate: false,
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

    setTemplatePermission(datas) {
        this.setState({
            canMakeTemplate: datas.can_make_template,
        });
    }

    editPlanning(planning, isDuplicate = false) {
        this.setState({
            showEditModale: true,
            planningEdited: planning,
            isDuplicate,
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
                    isDuplicate: false,
                });
            } else {
                console.error(`One error occured when trying to save planning: ${newPlanning.name}`);
            }
        });
    }

    duplicatePlanning(newPlanning) {
        const duplicatePlanning = {
            planning_to_copy: newPlanning.id,
            name: newPlanning.name,
            year: newPlanning.year,
        };
        this.setState({
            isUpdating: true,
        });
        saveDuplicatePlanning(duplicatePlanning, '/api/plannings/').then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    planningEdited: undefined,
                    isDuplicate: false,
                });
            } else {
                console.error(`One error occured when trying to duplicate planning: ${newPlanning.name}`);
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
                    duplicatePlanning={newPlanning => this.duplicatePlanning(newPlanning)}
                    isUpdating={this.state.isUpdating}
                    isDuplicate={this.state.isDuplicate}
                    canMakeTemplate={this.state.canMakeTemplate}
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
                                id="management.planning.title"
                                defaultMessage="Planning"
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
                        {
                            !this.state.isUpdating &&
                            <CustomTableComponent
                                withBorder={false}
                                isSortable
                                showPagination
                                endPointUrl={this.state.tableUrl}
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'name', desc: false }]}
                                params={this.props.params}
                                defaultPath="plannings"
                                dataKey="datas"
                                onDataLoaded={datas => this.setTemplatePermission(datas)}
                                callBackWithDataKey={false}
                                canSelect={false}
                            />
                        }
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.editPlanning()}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="main.label.new" defaultMessage="New" />
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
