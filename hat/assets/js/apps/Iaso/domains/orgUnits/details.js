import React, { Component, Fragment } from 'react';
import omit from 'lodash/omit';
import { connect } from 'react-redux';
import { push, replace } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles, Box, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';
import CustomTableComponent from '../../components/CustomTableComponent';

import {
    setCurrentOrgUnit,
    setOrgUnitTypes,
    resetOrgUnits,
    setCurrentForms,
    setSources,
    setGroups,
    setFetching,
    setFetchingDetail,
    saveOrgUnit as saveOrgUnitAction,
    createOrgUnit as createOrgUnitAction,
    setSourcesSelected,
} from './actions';
import { setAlgorithms, setAlgorithmRuns } from '../links/actions';

import { setForms as setFormsAction } from '../forms/actions';
import formsTableColumns from '../forms/config';
import { resetOrgUnitsLevels } from '../../redux/orgUnitsLevelsReducer';

import { createUrl } from '../../utils/fetchData';
import {
    fetchOrgUnitsTypes,
    fetchAssociatedDataSources,
    fetchOrgUnitDetail,
    fetchForms,
    fetchGroups,
    fetchSources,
    fetchOrgUnitsList,
    fetchLinks,
    fetchAlgorithms,
    fetchAlgorithmRuns,
    saveLink,
    fetchAssociatedOrgUnits,
} from '../../utils/requests';
import {
    getAliasesArrayFromString,
    getOrgUnitsTree,
    getSourcesWithoutCurrentSource,
} from './utils';
import { fetchUsersProfiles as fetchUsersProfilesAction } from '../users/actions';

import TopBar from '../../components/nav/TopBarComponent';
import OrgUnitForm from './components/OrgUnitForm';
import OrgUnitMap from './components/OrgUnitMapComponent';
import Logs from '../../components/logs/LogsComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import SingleTable from '../../components/tables/SingleTable';
import LinksDetails from '../links/components/LinksDetailsComponent';

import commonStyles from '../../styles/common';

import { getChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

import {
    orgUnitFiltersWithPrefix,
    linksFiltersWithPrefix,
    onlyChildrenParams,
} from '../../constants/filters';
import { orgUnitsTableColumns } from './config';
import { linksTableColumns } from '../links/config';
import injectIntl from '../../libs/intl/injectIntl';

const baseUrl = baseUrls.orgUnitDetails;

const styles = theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: '-100',
        opacity: '0',
    },
});

const initialOrgUnit = {
    id: null,
    name: '',
    org_unit_type_id: null,
    groups: [],
    sub_source: null,
    status: false,
    aliases: [],
};

class OrgUnitDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: props.params.tab ? props.params.tab : 'infos',
            currentOrgUnit: undefined,
            orgUnitModified: false,
            orgUnitLocationModified: false,
            fetchingFilters: true,
            tableColumns: formsTableColumns(
                props.intl.formatMessage,
                this,
                false,
                false,
            ),
        };
    }

    componentDidMount() {
        const {
            dispatch,
            params: { orgUnitId },
            fetchUsersProfiles,
            setSelectedSources,
        } = this.props;
        this.props.resetOrgUnitsLevels();
        dispatch(setFetching(true));
        const promisesArray = [];
        if (this.props.orgUnitTypes.length === 0) {
            promisesArray.push(
                fetchOrgUnitsTypes(dispatch).then(orgUnitTypes =>
                    this.props.setOrgUnitTypes(orgUnitTypes),
                ),
            );
        }

        fetchUsersProfiles();
        fetchAlgorithms(dispatch).then(algoList =>
            this.props.setAlgorithms(algoList),
        );
        fetchAlgorithmRuns(dispatch).then(algoRunsList =>
            this.props.setAlgorithmRuns(algoRunsList),
        );
        if (!this.props.sources) {
            promisesArray.push(
                fetchSources(dispatch).then(data => {
                    const sources = [];
                    data.forEach((s, i) => {
                        sources.push({
                            ...s,
                            color: getChipColors(i),
                        });
                    });
                    this.props.setSources(sources);
                }),
            );
        }

        if (this.props.groups.length === 0) {
            promisesArray.push(
                fetchGroups(dispatch, orgUnitId === '0').then(groups =>
                    this.props.setGroups(groups),
                ),
            );
        }
        const sources = [];
        if (orgUnitId !== '0') {
            fetchAssociatedDataSources(dispatch, orgUnitId).then(data => {
                data.forEach((s, i) => {
                    sources.push({
                        ...s,
                        color: getChipColors(i),
                    });
                });
                this.props.setSources(sources);
            });
        }

        Promise.all(promisesArray).then(() => {
            this.setState({
                fetchingFilters: false,
            });
            this.fetchDetail().then(async currentOrgUnit => {
                if (this.state.tab !== 'map') {
                    dispatch(setFetching(false));
                }
                dispatch(setFetchingDetail(false));
                const { links } = await fetchLinks(
                    dispatch,
                    `/api/links/?orgUnitId=${orgUnitId}`,
                );
                let selectedSources = [];
                links.forEach(l => {
                    const tempSources = getSourcesWithoutCurrentSource(
                        sources,
                        currentOrgUnit.source_id,
                    );
                    const linkSources = tempSources.filter(
                        s =>
                            (s.id === l.source.source_id &&
                                !selectedSources.find(
                                    ss => ss.id === l.source.source_id,
                                )) ||
                            (s.id === l.destination.source_id &&
                                !selectedSources.find(
                                    ss => ss.id === l.destination.source_id,
                                )),
                    );
                    if (linkSources.length > 0) {
                        selectedSources = selectedSources.concat(linkSources);
                    }
                });
                const fullSelectedSources = [];
                selectedSources.forEach(async (ss, index) => {
                    const detail = await fetchAssociatedOrgUnits(
                        dispatch,
                        ss,
                        currentOrgUnit,
                    );
                    fullSelectedSources.push(detail);
                    if (index === selectedSources.length - 1) {
                        setSelectedSources(fullSelectedSources);
                    }
                });
            });
        });
    }

    componentDidUpdate(prevProps) {
        const { params } = this.props;
        if (
            params.orgUnitId !== prevProps.params.orgUnitId &&
            prevProps.params.orgUnitId !== '0'
        ) {
            this.resetCurrentOrgUnit();
            this.fetchDetail();
        }
        if (params.tab !== prevProps.params.tab) {
            this.handleChangeTab(params.tab, false);
        }
    }

    setOrgUnitLocationModified() {
        this.setState({
            orgUnitLocationModified: true,
        });
    }

    resetCurrentOrgUnit() {
        this.setState({
            currentOrgUnit: undefined,
        });
    }

    fetchDetail() {
        const {
            params: { orgUnitId },
            dispatch,
        } = this.props;
        if (orgUnitId !== '0') {
            return fetchOrgUnitDetail(dispatch, orgUnitId).then(orgUnit => {
                const orgUnitTree = getOrgUnitsTree(orgUnit);
                if (orgUnitTree.length > 0) {
                    const { redirectTo, params } = this.props;
                    const levels = orgUnitTree.map(o => o.id);
                    const newParams = {
                        ...params,
                        levels,
                    };
                    redirectTo(baseUrl, newParams);
                }
                this.props.setCurrentOrgUnit(orgUnit);
                if (orgUnit.org_unit_type_id) {
                    fetchForms(
                        this.props.dispatch,
                        `/api/forms/?orgUnitTypeId=${orgUnit.org_unit_type_id}`,
                    ).then(data => {
                        const forms = [];
                        data.forms.forEach((f, i) => {
                            forms.push({
                                ...f,
                                color: getChipColors(i, true),
                            });
                        });
                        this.props.setCurrentForms(forms);
                    });
                }

                this.setState({
                    currentOrgUnit: orgUnit,
                });
                return orgUnit;
            });
        }
        this.props.setCurrentOrgUnit(initialOrgUnit);
        this.setState({
            currentOrgUnit: initialOrgUnit,
        });
        return new Promise(resolve => resolve());
    }

    handleChangeTab(tab, redirect = true) {
        if (redirect) {
            const { redirectTo, params } = this.props;
            const newParams = {
                ...params,
                tab,
            };
            redirectTo(baseUrl, newParams);
        }
        this.setState({
            tab,
        });
    }

    handleChangeShape(key, value) {
        const currentOrgUnit = {
            ...this.state.currentOrgUnit,
            [key]: value,
        };
        this.setState({
            currentOrgUnit,
        });
    }

    handleChangeLocation(location) {
        this.setState({
            orgUnitLocationModified: true,
            currentOrgUnit: {
                ...this.state.currentOrgUnit,
                latitude: location.lat
                    ? parseFloat(location.lat.toFixed(8))
                    : null,
                longitude: location.lng
                    ? parseFloat(location.lng.toFixed(8))
                    : null,
            },
        });
    }

    handleSaveOrgUnit(newOrgUnit) {
        // Don't send altitude for now, the interface does not handle it
        const { currentOrgUnit } = this.state;
        let orgUnitPayload = omit(
            { ...currentOrgUnit, ...newOrgUnit },
            'altitude',
        );
        orgUnitPayload = {
            ...orgUnitPayload,
            groups:
                orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                    ? orgUnitPayload.groups
                    : orgUnitPayload.groups.map(g => g.id),
        };
        const { saveOrgUnit, createOrgUnit, redirectTo, params } = this.props;

        const isNewOrgunit = currentOrgUnit && !currentOrgUnit.id;
        const savePromise = isNewOrgunit
            ? createOrgUnit(orgUnitPayload)
            : saveOrgUnit(orgUnitPayload);
        return savePromise
            .then(savedOrgUnit => {
                this.setState({
                    orgUnitLocationModified: false,
                    currentOrgUnit: savedOrgUnit,
                });
                this.props.resetOrgUnits();
                this.props.setCurrentOrgUnit(savedOrgUnit);
                if (isNewOrgunit) {
                    redirectTo(baseUrl, {
                        ...params,
                        orgUnitId: savedOrgUnit.id,
                    });
                }
                return savedOrgUnit;
            })
            .catch(err => {
                throw err;
            });
    }

    handleResetOrgUnit() {
        this.props.resetOrgUnitsLevels();
        const { redirectTo, params } = this.props;
        const newParams = {
            ...params,
            levels: null,
        };
        redirectTo(baseUrl, newParams);
        this.fetchDetail();
    }

    goToRevision(orgUnitRevision) {
        const mappedRevision = {
            ...this.props.currentOrgUnit,
            ...orgUnitRevision.fields,
            geo_json: null,
            aliases: orgUnitRevision.fields.aliases
                ? getAliasesArrayFromString(orgUnitRevision.fields.aliases)
                : this.props.currentOrgUnit.aliases,
            id: this.props.currentOrgUnit.id,
        };
        const { saveOrgUnit } = this.props;
        return saveOrgUnit(mappedRevision).then(currentOrgUnit => {
            this.setState({
                currentOrgUnit,
            });
            this.props.resetOrgUnits();
            this.props.setCurrentOrgUnit(currentOrgUnit);
        });
    }

    validateLink(link, handleFetch) {
        const { dispatch } = this.props;
        const newLink = {
            ...link,
            validated: !link.validated,
        };
        saveLink(dispatch, newLink).then(() => handleFetch());
    }

    render() {
        const {
            classes,
            fetching,
            fetchingSubOrgUnits,
            intl: { formatMessage },
            orgUnitTypes,
            groups,
            params,
            router,
            prevPathname,
            redirectToPush,
            reduxPage,
            sources,
            profiles,
            algorithms,
            algorithmRuns,
        } = this.props;
        const {
            tab,
            currentOrgUnit,
            orgUnitModified,
            orgUnitLocationModified,
            fetchingFilters,
        } = this.state;
        const isNewOrgunit = params.orgUnitId === '0';
        let title = '';
        if (currentOrgUnit) {
            title = !isNewOrgunit
                ? currentOrgUnit.name
                : formatMessage(MESSAGES.newOrgUnit);
            if (!isNewOrgunit) {
                title = `${title}${
                    currentOrgUnit.org_unit_type_name
                        ? ` - ${currentOrgUnit.org_unit_type_name}`
                        : ''
                }`;
            }
        }
        const tabs = ['infos', 'map', 'children', 'links', 'history', 'forms'];

        return (
            <Fragment>
                <TopBar
                    title={title}
                    displayBackButton
                    goBack={() => {
                        if (prevPathname) {
                            this.props.resetOrgUnitsLevels();
                            setTimeout(() => {
                                router.goBack();
                            }, 300);
                        } else {
                            redirectToPush(baseUrls.orgUnits, {});
                        }
                    }}
                >
                    {!isNewOrgunit && (
                        <Tabs
                            value={tab}
                            classes={{
                                root: classes.tabs,
                                indicator: classes.indicator,
                            }}
                            onChange={(event, newtab) =>
                                this.handleChangeTab(newtab)
                            }
                        >
                            {tabs.map(t => (
                                <Tab
                                    key={t}
                                    value={t}
                                    label={formatMessage(MESSAGES[t])}
                                />
                            ))}
                        </Tabs>
                    )}
                </TopBar>
                {(fetching || fetchingSubOrgUnits) && <LoadingSpinner />}
                {currentOrgUnit && (
                    <section>
                        {tab === 'infos' && (
                            <Box
                                className={
                                    isNewOrgunit
                                        ? classes.containerFullHeightNoTabPadded
                                        : classes.containerFullHeightPadded
                                }
                            >
                                <OrgUnitForm
                                    orgUnit={currentOrgUnit}
                                    orgUnitTypes={orgUnitTypes}
                                    groups={groups}
                                    onResetOrgUnit={() =>
                                        this.handleResetOrgUnit()
                                    }
                                    saveOrgUnit={newOrgUnit =>
                                        this.handleSaveOrgUnit(newOrgUnit)
                                    }
                                    params={params}
                                    baseUrl={baseUrl}
                                    orgUnitModified={orgUnitModified}
                                />
                            </Box>
                        )}
                        <div
                            className={
                                tab === 'map' ? '' : classes.hiddenOpacity
                            }
                        >
                            <Box className={classes.containerFullHeight}>
                                <OrgUnitMap
                                    setOrgUnitLocationModified={() =>
                                        this.setOrgUnitLocationModified()
                                    }
                                    orgUnitLocationModified={
                                        orgUnitLocationModified
                                    }
                                    orgUnit={currentOrgUnit}
                                    resetOrgUnit={() =>
                                        this.handleResetOrgUnit()
                                    }
                                    saveOrgUnit={() =>
                                        this.handleSaveOrgUnit(currentOrgUnit)
                                    }
                                    onChangeLocation={location => {
                                        this.handleChangeLocation(location);
                                    }}
                                    onChangeShape={(keyValue, shape) =>
                                        this.handleChangeShape(keyValue, shape)
                                    }
                                />
                            </Box>
                        </div>
                        {tab === 'history' && (
                            <Box className={classes.containerFullHeightPadded}>
                                <Logs
                                    params={params}
                                    logObjectId={currentOrgUnit.id}
                                    goToRevision={orgUnitRevision =>
                                        this.goToRevision(orgUnitRevision)
                                    }
                                />
                            </Box>
                        )}
                        {tab === 'forms' && (
                            <Box className={classes.containerFullHeightPadded}>
                                <div className={classes.reactTable}>
                                    <CustomTableComponent
                                        isSortable
                                        pageSize={50}
                                        showPagination
                                        endPointUrl={`/api/forms/?orgUnitId=${currentOrgUnit.id}`}
                                        columns={this.state.tableColumns}
                                        defaultSorted={[
                                            {
                                                id: 'instance_updated_at',
                                                desc: false,
                                            },
                                        ]}
                                        params={params}
                                        defaultPath={baseUrl}
                                        dataKey="forms"
                                        canSelect={false}
                                        multiSort
                                        onDataLoaded={(
                                            newFormsList,
                                            count,
                                            pages,
                                        ) => {
                                            this.props.setForms(
                                                newFormsList,
                                                true,
                                                params,
                                                count,
                                                pages,
                                            );
                                            this.setState({ isUpdated: false });
                                        }}
                                        reduxPage={reduxPage}
                                        isUpdated={this.state.isUpdated}
                                    />
                                </div>
                            </Box>
                        )}
                        <div
                            className={
                                tab === 'children' ? '' : classes.hiddenOpacity
                            }
                        >
                            <SingleTable
                                paramsPrefix="childrenParams"
                                apiParams={{
                                    ...onlyChildrenParams(
                                        'childrenParams',
                                        params,
                                        currentOrgUnit,
                                    ),
                                }}
                                baseUrl={baseUrl}
                                endPointPath="orgunits"
                                fetchItems={fetchOrgUnitsList}
                                filters={orgUnitFiltersWithPrefix(
                                    'childrenParams',
                                    true,
                                    formatMessage,
                                    groups,
                                    orgUnitTypes,
                                )}
                                columns={orgUnitsTableColumns(
                                    formatMessage,
                                    classes,
                                )}
                            />
                        </div>
                        <div
                            className={
                                tab === 'links' ? '' : classes.hiddenOpacity
                            }
                        >
                            <SingleTable
                                apiParams={{
                                    orgUnitId: currentOrgUnit.id,
                                }}
                                filters={linksFiltersWithPrefix(
                                    'linksParams',
                                    algorithmRuns,
                                    formatMessage,
                                    profiles,
                                    algorithms,
                                    sources,
                                )}
                                paramsPrefix="linksParams"
                                baseUrl={baseUrl}
                                endPointPath="links"
                                fetchItems={fetchLinks}
                                defaultSorted={[
                                    { id: 'similarity_score', desc: false },
                                ]}
                                columns={handleFetch =>
                                    linksTableColumns(
                                        formatMessage,
                                        link =>
                                            this.validateLink(
                                                link,
                                                handleFetch,
                                            ),
                                        classes,
                                    )
                                }
                                subComponent={(link, handleFetch) =>
                                    link ? (
                                        <LinksDetails
                                            linkId={link.id}
                                            validated={link.validated}
                                            validateLink={() =>
                                                this.validateLink(
                                                    link,
                                                    handleFetch,
                                                )
                                            }
                                        />
                                    ) : null
                                }
                            />
                        </div>
                    </section>
                )}
            </Fragment>
        );
    }
}
OrgUnitDetail.defaultProps = {
    currentOrgUnit: undefined,
    sources: [],
    prevPathname: null,
    reduxPage: undefined,
};

OrgUnitDetail.propTypes = {
    router: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    setCurrentOrgUnit: PropTypes.func.isRequired,
    setCurrentForms: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    redirectToPush: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    fetchingSubOrgUnits: PropTypes.bool.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
    resetOrgUnitsLevels: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    sources: PropTypes.array,
    prevPathname: PropTypes.any,
    groups: PropTypes.array.isRequired,
    setGroups: PropTypes.func.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    createOrgUnit: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setAlgorithmRuns: PropTypes.func.isRequired,
    setForms: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    profiles: PropTypes.array.isRequired,
    algorithms: PropTypes.array.isRequired,
    algorithmRuns: PropTypes.array.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    setSelectedSources: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    fetchingSubOrgUnits: state.orgUnits.fetchingSubOrgUnits,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    currentForms: state.orgUnits.currentForms,
    sources: state.orgUnits.sources,
    prevPathname: state.routerCustom.prevPathname,
    groups: state.orgUnits.groups,
    profiles: state.users.list,
    algorithms: state.links.algorithmsList,
    algorithmRuns: state.links.algorithmRunsList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setCurrentForms: currentForms => dispatch(setCurrentForms(currentForms)),
    redirectTo: (key, params) =>
        dispatch(replace(`${key}${createUrl(params, '')}`)),
    redirectToPush: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
    setSources: sources => dispatch(setSources(sources)),
    setGroups: groups => dispatch(setGroups(groups)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
    setAlgorithmRuns: algoRunsList => dispatch(setAlgorithmRuns(algoRunsList)),
    setSelectedSources: sources => dispatch(setSourcesSelected(sources)),
    ...bindActionCreators(
        {
            setForms: setFormsAction,
            saveOrgUnit: saveOrgUnitAction,
            createOrgUnit: createOrgUnitAction,
            fetchUsersProfiles: fetchUsersProfilesAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
