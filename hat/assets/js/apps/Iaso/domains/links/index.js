import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchOrgUnitsTypes,
    saveLink,
    fetchSources,
    fetchAlgorithms,
    fetchAlgorithmRuns,
    fetchLinks,
} from '../../utils/requests';

import { setOrgUnitTypes, setSources } from '../orgUnits/actions';

import { setAlgorithms, setAlgorithmRuns } from './actions';

import { linksTableColumns } from './config';

import { createUrl } from '../../utils/fetchData';

import TopBar from '../../components/nav/TopBarComponent';
import LinksDetails from './components/LinksDetailsComponent';
import SingleTable from '../../components/tables/SingleTable';
import { fetchUsersProfiles as fetchUsersProfilesAction } from '../users/actions';

import commonStyles from '../../styles/common';

import { baseUrls } from '../../constants/urls';
import { linksFilters } from '../../constants/filters';

import MESSAGES from './messages';
import injectIntl from '../../libs/intl/injectIntl';

const baseUrl = baseUrls.links;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Links extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: linksTableColumns(
                props.intl.formatMessage,
                link => this.validateLink(link),
                props.classes,
            ),
            expanded: {},
            forceRefresh: false,
        };
    }

    componentWillMount() {
        const { dispatch, fetchUsersProfiles } = this.props;
        fetchUsersProfiles();
        fetchOrgUnitsTypes(dispatch).then(orgUnitTypes =>
            this.props.setOrgUnitTypes(orgUnitTypes),
        );
        fetchSources(dispatch).then(sources => this.props.setSources(sources));
        fetchAlgorithms(dispatch).then(algoList =>
            this.props.setAlgorithms(algoList),
        );
        fetchAlgorithmRuns(dispatch).then(algoRunsList =>
            this.props.setAlgorithmRuns(algoRunsList),
        );
    }

    onExpandedChange(expanded) {
        this.setState({
            expanded,
        });
    }

    onDataLoaded() {
        this.setState({
            expanded: {},
        });
    }

    validateLink(link) {
        const { dispatch } = this.props;
        const newLink = {
            ...link,
            validated: !link.validated,
        };
        saveLink(dispatch, newLink).then(() => {
            this.setState({
                forceRefresh: true,
            });
        });
    }

    render() {
        const {
            params,
            intl: { formatMessage },
            prevPathname,
            router,
            orgUnitTypes,
            sources,
            profiles,
            algorithms,
            algorithmRuns,
        } = this.props;
        const { tableColumns, expanded, forceRefresh } = this.state;
        const displayBackButton =
            prevPathname && prevPathname.includes('/links/runs/');
        let currentOrigin;
        if (params.origin && sources) {
            currentOrigin = sources.find(
                s => s.id === parseInt(params.origin, 10),
            );
        }
        let currentDestination;
        if (params.destination && sources) {
            currentDestination = sources.find(
                s => s.id === parseInt(params.destination, 10),
            );
        }
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton={displayBackButton}
                    goBack={() => router.goBack()}
                />
                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="links"
                    hideGpkg
                    dataKey="links"
                    apiParams={{
                        ...params,
                    }}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => {
                        this.setState({
                            forceRefresh: false,
                        });
                    }}
                    searchActive={params.searchActive === 'true'}
                    fetchItems={fetchLinks}
                    defaultSorted={[{ id: 'similarity_score', desc: true }]}
                    toggleActiveSearch
                    columns={tableColumns}
                    filters={linksFilters(
                        formatMessage,
                        algorithmRuns,
                        orgUnitTypes,
                        profiles,
                        algorithms,
                        sources,
                        currentOrigin,
                        currentDestination,
                    )}
                    onDataLoaded={({ list, count, pages }) => {
                        this.onDataLoaded(list, count, pages);
                    }}
                    extraProps={{
                        expanded,
                        onExpandedChange: newExpanded =>
                            this.onExpandedChange(newExpanded),
                    }}
                    subComponent={link =>
                        link ? (
                            <LinksDetails
                                linkId={link.id}
                                validated={link.validated}
                                validateLink={() => this.validateLink(link)}
                            />
                        ) : null
                    }
                />
            </>
        );
    }
}

Links.defaultProps = {
    prevPathname: null,
    sources: [],
};

Links.propTypes = {
    router: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setAlgorithmRuns: PropTypes.func.isRequired,
    prevPathname: PropTypes.any,
    fetchUsersProfiles: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.array,
    profiles: PropTypes.array.isRequired,
    algorithms: PropTypes.array.isRequired,
    algorithmRuns: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    prevPathname: state.routerCustom.prevPathname,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    profiles: state.users.list,
    algorithms: state.links.algorithmsList,
    algorithmRuns: state.links.algorithmRunsList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
    setAlgorithmRuns: algoRunsList => dispatch(setAlgorithmRuns(algoRunsList)),
    ...bindActionCreators(
        {
            fetchUsersProfiles: fetchUsersProfilesAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Links)),
);
