import React, { Component, Fragment } from 'react';
import omit from 'lodash/omit';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push, replace } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles, Box, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';

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
} from './actions';
import { resetOrgUnitsLevels } from '../../redux/orgUnitsLevelsReducer';

import { createUrl } from '../../utils/fetchData';
import {
    fetchOrgUnitsTypes,
    fetchAssociatedDataSources,
    fetchOrgUnitDetail,
    fetchForms,
    fetchGroups,
    fetchSources,
} from '../../utils/requests';
import { getAliasesArrayFromString, getOrgUnitsTree } from './utils';

import TopBar from '../../components/nav/TopBarComponent';
import OrgUnitForm from './components/OrgUnitForm';
import OrgUnitMap from './components/OrgUnitMapComponent';
import Logs from '../../components/logs/LogsComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import commonStyles from '../../styles/common';

import { getChipColors } from '../../constants/chipColors';

import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';

const baseUrl = baseUrls.orgUnitDetails;

const styles = theme => ({
    ...commonStyles(theme),
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
        };
    }

    componentDidMount() {
        const {
            dispatch,
            params: { orgUnitId },
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
                fetchGroups(dispatch).then(groups =>
                    this.props.setGroups(groups),
                ),
            );
        }
        if (orgUnitId !== '0') {
            fetchAssociatedDataSources(dispatch, orgUnitId).then(data => {
                const sources = [];
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
            this.fetchDetail().then(() => {
                if (this.state.tab !== 'map') {
                    dispatch(setFetching(false));
                }
                dispatch(setFetchingDetail(false));
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
        } = this.props;
        const {
            tab,
            currentOrgUnit,
            orgUnitModified,
            orgUnitLocationModified,
            fetchingFilters,
        } = this.state;
        const isNewOrgunit = currentOrgUnit && !currentOrgUnit.id;
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
                            <Tab
                                value="infos"
                                label={formatMessage(MESSAGES.infos)}
                            />
                            <Tab
                                value="map"
                                label={formatMessage(MESSAGES.map)}
                            />
                            <Tab
                                value="history"
                                label={formatMessage(MESSAGES.history)}
                            />
                        </Tabs>
                    )}
                </TopBar>
                {(fetching || fetchingSubOrgUnits) && <LoadingSpinner />}
                {currentOrgUnit && (
                    <section>
                        {tab === 'infos' && (
                            <Box className={classes.containerFullHeightPadded}>
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
                        {tab === 'map' && !fetchingFilters && (
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
                        )}
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
    ...bindActionCreators(
        {
            saveOrgUnit: saveOrgUnitAction,
            createOrgUnit: createOrgUnitAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
