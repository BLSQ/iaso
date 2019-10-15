import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles, Grid, Paper,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchOrgUnitsTypes,
    saveLink,
    fetchSources,
    fetchProfiles,
    fetchAlgorithms,
} from '../utils/requests';

import {
    setOrgUnitTypes,
    setSources,
} from '../redux/orgUnitsReducer';
import {
    setLinks,
    setLinksListFetching,
    setAlgorithms,
} from '../redux/linksReducer';
import {
    setProfiles,
} from '../redux/profilesReducer';

import linksTableColumns from '../constants/linksTableColumns';

import { createUrl } from '../../../utils/fetchData';

import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import LinksFiltersComponent from '../components/filters/LinksFiltersComponent';

import commonStyles from '../styles/common';
import reactTable from '../styles/reactTable';

const baseUrl = 'links';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...reactTable(theme).reactTable,
        marginTop: theme.spacing(4),
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
    tableButton: {
        marginRight: theme.spacing(2),
    },
});

class Links extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: linksTableColumns(props.intl.formatMessage, this),
            tableUrl: null,
        };
    }

    componentWillMount() {
        const { dispatch } = this.props;
        if (this.props.params.searchActive) {
            this.onSearch();
        }
        fetchOrgUnitsTypes(dispatch)
            .then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        fetchSources(dispatch)
            .then(sources => this.props.setSources(sources));
        fetchProfiles(dispatch)
            .then(profiles => this.props.setProfiles(profiles));
        fetchAlgorithms(dispatch)
            .then(algoList => this.props.setAlgorithms(algoList));
    }

    componentDidUpdate() {
        if (!this.props.params.searchActive && this.props.reduxPage.list) {
            this.resetData();
        }
    }

    componentWillUnmount() {
        this.props.setLinks(null, this.props.params, 0, 1);
    }

    onSearch() {
        const { redirectTo, params } = this.props;
        const newParams = {
            ...params,
        };
        if (!params.searchActive) {
            newParams.searchActive = true;
        }
        redirectTo(baseUrl, newParams);
        const url = this.getEndpointUrl();
        this.setState({
            tableUrl: url,
        });
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        let url = '/api/links/?';
        const {
            params,
        } = this.props;

        const clonedParams = { ...params };

        if (toExport) {
            clonedParams[exportType] = true;
        }

        Object.keys(clonedParams).forEach((key) => {
            const value = clonedParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });

        return url;
    }

    resetData() {
        this.setState({
            tableUrl: null,
        });
        this.props.setLinks(null, this.props.params, 0, 1);
    }

    validateLink(link) {
        const {
            dispatch,
            reduxPage,
            params,
        } = this.props;
        const newLink = {
            ...link,
            validated: !link.validated,
        };
        saveLink(dispatch, newLink).then((savedLink) => {
            const linksList = [];
            reduxPage.list.forEach((l) => {
                if (l.id !== savedLink.id) {
                    linksList.push(l);
                } else {
                    linksList.push(savedLink);
                }
            });
            this.props.setLinks(linksList, params, reduxPage.count, reduxPage.pages);
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
            dispatch,
            fetchingList,
        } = this.props;
        const {
            tableUrl,
            tableColumns,
        } = this.state;

        return (
            <Fragment>
                {
                    fetchingList
                    && <LoadingSpinner />
                }
                <TopBar title={formatMessage({
                    defaultMessage: 'Links validation',
                    id: 'iaso.links.title',
                })}
                />
                <Paper className={classes.paperContainer}>
                    <LinksFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                    />
                    {
                        tableUrl && (
                            <Fragment>
                                <div className={classes.reactTable}>
                                    <CustomTableComponent
                                        isSortable
                                        pageSize={10}
                                        showPagination
                                        endPointUrl={tableUrl}
                                        columns={tableColumns}
                                        defaultSorted={[{ id: 'similarity_score', desc: true }]}
                                        params={params}
                                        defaultPath={baseUrl}
                                        dataKey="links"
                                        canSelect={false}
                                        multiSort
                                        onDataStartLoaded={() => dispatch(this.props.setLinksListFetching(true))}
                                        onDataLoaded={(linksList, count, pages) => {
                                            dispatch(this.props.setLinksListFetching(false));
                                            this.props.setLinks(linksList, this.props.params, count, pages);
                                        }}
                                        reduxPage={reduxPage}
                                    />
                                </div>
                                <Grid container spacing={0} alignItems="center" className={classes.marginTop}>
                                    <Grid xs={12} item className={classes.textAlignRight}>
                                        <DownloadButtonsComponent
                                            csvUrl={this.getEndpointUrl(true, 'csv')}
                                            xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                        />
                                    </Grid>
                                </Grid>
                            </Fragment>
                        )
                    }
                </Paper>
            </Fragment>
        );
    }
}
Links.defaultProps = {
    reduxPage: undefined,
};

Links.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setLinks: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setLinksListFetching: PropTypes.func.isRequired,
    fetchingList: PropTypes.bool.isRequired,
    setSources: PropTypes.func.isRequired,
    setProfiles: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    fetchingList: state.orgUnits.fetchingList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setLinks: (linksList, params, count, pages) => dispatch(setLinks(linksList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setLinksListFetching: isFetching => dispatch(setLinksListFetching(isFetching)),
    setSources: sources => dispatch(setSources(sources)),
    setProfiles: profiles => dispatch(setProfiles(profiles)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Links)),
);
