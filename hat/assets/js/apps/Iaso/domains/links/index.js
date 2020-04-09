import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles, Grid, Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchOrgUnitsTypes,
    saveLink,
    fetchSources,
    fetchIasoProfiles,
    fetchAlgorithms,
    fetchAlgorithmRuns,
} from '../../utils/requests';

import {
    setOrgUnitTypes,
    setSources,
} from '../orgUnits/actions';

import {
    setLinks,
    setIsFetching,
    setAlgorithms,
    setAlgorithmRuns,
} from './actions';
import {
    setProfiles,
} from '../../redux/profilesReducer';

import { linksTableColumns } from './config';

import { createUrl } from '../../../../utils/fetchData';
import getTableUrl from '../../utils/tableUtils';

import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import CustomTableComponent from '../../../../components/CustomTableComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import LinksFiltersComponent from './components/LinksFiltersComponent';
import LinksDetails from './components/LinksDetailsComponent';


import commonStyles from '../../styles/common';

import { linksPath } from '../../constants/paths';

const { baseUrl } = linksPath;

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
            tableColumns: linksTableColumns(props.intl.formatMessage, this, props.classes),
            tableUrl: null,
            expanded: {},
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
        fetchIasoProfiles(dispatch)
            .then(profiles => this.props.setProfiles(profiles));
        fetchAlgorithms(dispatch)
            .then(algoList => this.props.setAlgorithms(algoList));
        fetchAlgorithmRuns(dispatch)
            .then(algoRunsList => this.props.setAlgorithmRuns(algoRunsList));
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

    onExpandedChange(expanded) {
        this.setState({
            expanded,
        });
    }

    onDataLoaded(linksList, count, pages) {
        const {
            dispatch,
        } = this.props;
        this.setState({
            expanded: {},
        });
        dispatch(this.props.setIsFetching(false));
        this.props.setLinks(linksList, this.props.params, count, pages);
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        return getTableUrl('links', this.props.params, toExport, exportType);
    }

    resetData() {
        this.setState({
            tableUrl: null,
            expanded: {},
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
            fetching,
            prevPathname,
            router,
        } = this.props;
        const {
            tableUrl,
            tableColumns,
            expanded,
        } = this.state;
        const displayBackButton = prevPathname && prevPathname.includes('/links/runs/');
        return (
            <Fragment>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'Links validation',
                        id: 'iaso.links.title',
                    })}
                    displayBackButton={displayBackButton}
                    goBack={() => router.goBack()}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
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
                                        expanded={expanded}
                                        onExpandedChange={(newExpanded, index) => this.onExpandedChange(newExpanded, index)}
                                        disableHeaderFixed
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
                                        onDataStartLoaded={() => dispatch(this.props.setIsFetching(true))}
                                        onDataLoaded={(linksList, count, pages) => this.onDataLoaded(linksList, count, pages)}
                                        reduxPage={reduxPage}
                                        SubComponent={({ original }) => (original
                                            ? (
                                                <LinksDetails
                                                    linkId={original.id}
                                                    validated={original.validated}
                                                    validateLink={() => this.validateLink(original)}
                                                />
                                            )
                                            : null)}
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
                </Box>
            </Fragment>
        );
    }
}
Links.defaultProps = {
    reduxPage: undefined,
    prevPathname: null,
};

Links.propTypes = {
    router: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setLinks: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setIsFetching: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    setSources: PropTypes.func.isRequired,
    setProfiles: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setAlgorithmRuns: PropTypes.func.isRequired,
    prevPathname: PropTypes.any,
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    fetching: state.links.fetching,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setLinks: (linksList, params, count, pages) => dispatch(setLinks(linksList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setIsFetching: isFetching => dispatch(setIsFetching(isFetching)),
    setSources: sources => dispatch(setSources(sources)),
    setProfiles: profiles => dispatch(setProfiles(profiles)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
    setAlgorithmRuns: algoRunsList => dispatch(setAlgorithmRuns(algoRunsList)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Links)),
);
