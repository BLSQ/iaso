import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import CheckCircle from '@material-ui/icons/CheckCircle';
import HighlightOff from '@material-ui/icons/HighlightOff';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl, getRequest } from '../../../utils/fetchData';
import UserModaleComponent from '../components/UserModaleComponent';
import { userActions } from '../redux/users';
import { teamsActions } from '../redux/teams';
import Search from '../../../components/Search';
import FiltersComponent from '../../../components/FiltersComponent';
import {
    teamType, institutions, activeUsers, inactiveUsers,
} from '../../../utils/constants/filters';

const baseUrl = 'users';


const MESSAGES = defineMessages({
    searchPlaceholder: {
        defaultMessage: 'Recherche',
        id: 'listlocator.search.placeholder',
    },
});
class ManagementUsers extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;

        const { dispatch } = props;
        dispatch(userActions.fetchInstitutions(dispatch));
        dispatch(userActions.fetchProvinces(dispatch));
        dispatch(userActions.fetchTeams(dispatch));
        dispatch(userActions.fetchPermissions(dispatch));
        dispatch(userActions.fetchCoordinations(dispatch));
        dispatch(userActions.fetchUserTypes(dispatch));
        dispatch(userActions.fetchTesterTypes(dispatch));
        dispatch(userActions.fetchScreeningTypes(dispatch));
        dispatch(userActions.fetchUserLevels(dispatch));
        this.state = {
            tableColumns: [
                {
                    Header: formatMessage({
                        defaultMessage: 'Nom d\'utilisateur',
                        id: 'main.label.userName',
                    }),
                    accessor: 'userName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'First name',
                        id: 'main.label.firstName',
                    }),
                    accessor: 'firstName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Name',
                        id: 'main.label.lastName',
                    }),
                    accessor: 'lastName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Institution',
                        id: 'main.label.institution',
                    }),
                    width: 150,
                    accessor: 'institution',
                    Cell: settings => (<span>{settings.original.institution ? settings.original.institution.name : ''}</span>),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Active',
                        id: 'main.label.active',
                    }),
                    accessor: 'user__is_active',
                    Cell: settings => (
                        <span>
                            { settings.original.is_active && <CheckCircle className="icon-green" />}
                            { !settings.original.is_active && <HighlightOff className="icon-error" />}
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.label.actions',
                    }),
                    width: 180,
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--edit--tiny margin-right"
                                onClick={() => this.props.selectUser(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                            </button>
                        </section>
                    ),
                },
            ],
            showEditModale: false,
        };
    }

    componentDidMount() {
        this.fetchTeamTypes();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showEditModale: nextProps.selectedUser !== null,
        });
    }

    onSearch(value) {
        this.props.redirectTo(baseUrl, {
            ...this.props.params,
            search: value,
        });
    }

    getEndpointUrl() {
        let url = '/api/profiles/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
        };

        if (!urlParams.team_type) {
            url += 'team_type=all';
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    saveData(newData) {
        const { dispatch } = this.props;
        if (newData.id === 0) {
            dispatch(userActions.createUser(dispatch, newData));
        } else {
            dispatch(userActions.updateUser(dispatch, newData));
        }
    }

    fetchTeamTypes() {
        const { dispatch } = this.props;
        getRequest('/api/teamtypes/', dispatch).then((teamtypesList) => {
            dispatch(teamsActions.loadTeamTypes(teamtypesList));
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        const {
            coordinationsList,
            institutionsList,
            userTypes,
            testerTypes,
            screeningTypes,
            userLevels,
            permissions,
            provinces,
            zones,
            areas,
            selectProvince,
            selectZone,
            updateCurrentUser,
            selectedUser,
            teams,
            load,
            teamTypes,
            params,
        } = this.props;

        return (
            <section>
                {
                    this.state.showEditModale
                    && (
                        <UserModaleComponent
                            showModale={this.state.showEditModale}
                            closeModal={() => this.props.selectUser(null)}
                            user={selectedUser}
                            saveData={newData => this.saveData(newData)}
                            coordinations={coordinationsList}
                            institutions={institutionsList}
                            userTypes={userTypes}
                            testerTypes={testerTypes}
                            screeningTypes={screeningTypes}
                            userLevels={userLevels}
                            permissions={permissions}
                            provinces={provinces}
                            zones={zones}
                            areas={areas}
                            teams={teams}
                            selectProvince={(provinceId, zoneId) => selectProvince(provinceId, zoneId)}
                            selectZone={zoneId => selectZone(zoneId)}
                            updateCurrentUser={user => updateCurrentUser(user)}
                            deleteUserZones
                            isUpdated={this.props.isUpdated}
                            error={load.error}
                        />
                    )
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.users.title"
                                defaultMessage="Users"
                            />
                        </h2>

                    </div>
                </div>
                <div className="widget__container management-control">
                    <div className="widget__content--tier">
                        <div>
                            <span className="map__text--select">
                                <FormattedMessage
                                    id="main.label.textSearch"
                                    defaultMessage="Text search"
                                />
                            </span>
                            <Search
                                placeholderText={formatMessage(MESSAGES.searchPlaceholder)}
                                allowEmptySearch
                                onSearch={value => this.onSearch(value)}
                                resetSearch={() => this.onSearch(null)}
                                displayResults={false}
                                searchString={this.props.params.search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    institutions(institutionsList),
                                ]}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={[
                                    teamType(formatMessage, teamTypes, {
                                        id: 'main.label.team_user_type',
                                        defaultMessage: 'User type',
                                    }, {
                                        id: 'main.label.allMale',
                                        defaultMessage: 'All',
                                    }),
                                    activeUsers(params.inactive === undefined),
                                    inactiveUsers(params.active === undefined),
                                ]}
                            />
                        </div>
                    </div>
                </div>
                <div className="widget__container management-control">
                    {
                        loading
                        && (
                            <LoadingSpinner message={formatMessage({
                                defaultMessage: 'Loading',
                                id: 'main.label.loading',
                            })}
                            />
                        )
                    }
                    <section>
                        <CustomTableComponent
                            pageSize={50}
                            withBorder={false}
                            isSortable
                            showPagination
                            endPointUrl={this.getEndpointUrl()}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'id', desc: false }]}
                            params={this.props.params}
                            defaultPath="users"
                            dataKey="users"
                            onDataLoaded={users => (this.props.setUsers(users))}
                            onDataUpdated={isUpdated => (this.props.userUpdated(isUpdated))}
                            isUpdated={this.props.isUpdated}
                            canSelect={false}
                        />
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.props.selectUser({
                                    id: 0,
                                    province: [],
                                    AS: [],
                                    ZS: [],
                                    permissions: [],
                                    is_active: true,
                                })}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="main.label.new" defaultMessage="New" />
                            </button>
                        </div>
                    </section>
                </div>
            </section>
        );
    }
}
ManagementUsers.defaultProps = {
    selectedUser: null,
};

ManagementUsers.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setUsers: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    userUpdated: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    institutionsList: PropTypes.array.isRequired,
    coordinationsList: PropTypes.array.isRequired,
    userTypes: PropTypes.array.isRequired,
    testerTypes: PropTypes.array.isRequired,
    userLevels: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectUser: PropTypes.func.isRequired,
    selectedUser: PropTypes.object,
    updateCurrentUser: PropTypes.func.isRequired,
    teamTypes: PropTypes.array.isRequired,
    screeningTypes: PropTypes.array.isRequired,
};

const ManagementUsersIntl = injectIntl(ManagementUsers);

const MapStateToProps = state => ({
    load: state.load,
    institutionsList: state.users.institutions,
    coordinationsList: state.users.coordinations,
    userTypes: state.users.userTypes,
    testerTypes: state.users.testerTypes,
    screeningTypes: state.users.screeningTypes,
    userLevels: state.users.userLevels,
    permissions: state.users.permissions,
    provinces: state.users.provinces,
    teams: state.users.teams,
    zones: state.users.zones,
    areas: state.users.areas,
    isUpdated: state.users.isUpdated,
    selectedUser: state.users.current,
    teamTypes: state.teams.teamTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setUsers: users => dispatch(userActions.setUsers(users)),
    userUpdated: isUpdated => dispatch(userActions.userUpdated(isUpdated)),
    selectProvince: (provinceId, zoneId) => dispatch(userActions.selectProvince(provinceId, dispatch, zoneId)),
    selectZone: zoneId => dispatch(userActions.selectZone(zoneId, dispatch)),
    updateCurrentUser: areaId => dispatch(userActions.updateCurrentUser(areaId)),
    selectUser: user => dispatch(userActions.selectUser(user)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementUsersIntl);
