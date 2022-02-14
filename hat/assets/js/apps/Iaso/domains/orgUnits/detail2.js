/* eslint-disable camelcase */
import React, { useEffect, useState, useCallback } from 'react';
import omit from 'lodash/omit';
import { connect } from 'react-redux';
import { push, replace } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles, Box, Tabs, Tab, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    createUrl,
    injectIntl,
    commonStyles,
    LoadingSpinner,
} from 'bluesquare-components';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import TopBar from '../../components/nav/TopBarComponent';
import {
    setCurrentOrgUnit,
    setOrgUnitTypes,
    resetOrgUnits,
    setSources,
    setGroups,
    setFetchingDetail,
    saveOrgUnit as saveOrgUnitAction,
    createOrgUnit as createOrgUnitAction,
} from './actions';
import { setAlgorithms, setAlgorithmRuns } from '../links/actions';

import formsTableColumns from '../forms/config';

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
    deleteForm,
} from '../../utils/requests';
import {
    getAliasesArrayFromString,
    getOrgUnitsTree,
    getLinksSources,
} from './utils';
import { fetchUsersProfiles as fetchUsersProfilesAction } from '../users/actions';

import OrgUnitForm from './components/OrgUnitForm';
import OrgUnitMap from './components/orgUnitMap/OrgUnitMapComponent';
import Logs from '../../components/logs/LogsComponent';
import SingleTable from '../../components/tables/SingleTable';
import LinksDetails from '../links/components/LinksDetailsComponent';

import { getChipColors, getOtChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';

import {
    orgUnitFiltersWithPrefix,
    linksFiltersWithPrefix,
    onlyChildrenParams,
} from '../../constants/filters';
import { orgUnitsTableColumns } from './config';
import { linksTableColumns } from '../links/config';
import { OrgUnitsMapComments } from './components/orgUnitMap/OrgUnitsMapComments';
// import { userHasPermission } from '../users/utils';

const baseUrl = baseUrls.orgUnitDetails;

const styles = theme => ({
    ...commonStyles(theme),
    root: {
        '& path.primary': {
            fill: alpha(theme.palette.primary.main, 0.6),
            stroke: theme.palette.primary.main,
            strokeOpacity: 1,
            strokeWidth: 3,
        },
        '& path.secondary': {
            fill: alpha(theme.palette.secondary.main, 0.6),
            stroke: theme.palette.secondary.main,
            strokeOpacity: 1,
            strokeWidth: 3,
        },
    },
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100vw',
        zIndex: '-100',
        opacity: '0',
    },
    comments: {
        overflowY: 'auto',
        height: '65vh',
    },
    commentsWrapper: {
        backgroundColor: 'white',
        paddingTop: '10px',
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

const tabs = [
    'infos',
    'map',
    'children',
    'links',
    'history',
    'forms',
    'comments',
];

const OrgUnitDetail = props => {
    const {
        classes,
        dispatch,
        fetching,
        intl: { formatMessage },
        orgUnitTypes,
        groups,
        params,
        router,
        prevPathname,
        redirectToPush,
        sources,
        profiles,
        algorithms,
        algorithmRuns,
        currentUser,
        redirectTo,
        currentOrgUnit,
    } = props;
    const [tab, setTab] = useState(params.tab ? params.tab : 'infos');
    const [sourcesSelected, setSourcesSelected] = useState(undefined);
    const [orgUnitLocationModified, setOrgUnitLocationModified] =
        useState(false);
    const [forceSingleTableRefresh, setForceSingleTableRefresh] =
        useState(false);

    const isNewOrgunit = params.orgUnitId === '0';
    let title = '';
    if (currentOrgUnit) {
        title = !isNewOrgunit
            ? currentOrgUnit?.name ?? ''
            : formatMessage(MESSAGES.newOrgUnit);
        if (!isNewOrgunit) {
            title = `${title}${
                currentOrgUnit.org_unit_type_name
                    ? ` - ${currentOrgUnit.org_unit_type_name}`
                    : ''
            }`;
        }
    }

    const fetchDetail = useCallback(() => {
        const { orgUnitId } = params;
        if (orgUnitId !== '0') {
            return fetchOrgUnitDetail(dispatch, orgUnitId).then(orgUnit => {
                const orgUnitTree = getOrgUnitsTree(orgUnit);
                if (orgUnitTree.length > 0) {
                    const levels = orgUnitTree.map(o => o.id);
                    const newParams = {
                        ...params,
                        levels,
                    };
                    redirectTo(baseUrl, newParams);
                }
                props.setCurrentOrgUnit(orgUnit);
                return orgUnit;
            });
        }
        props.setCurrentOrgUnit(initialOrgUnit);
        return new Promise(resolve => resolve());
    }, [dispatch, params, props, redirectTo]);

    const handleResetOrgUnit = async () => {
        const newParams = {
            ...params,
            levels: null,
        };
        redirectTo(baseUrl, newParams);

        dispatch(setFetchingDetail(true));
        await fetchDetail();
        dispatch(setFetchingDetail(false));
    };

    const handleDeleteForm = async formId => {
        await deleteForm(dispatch, formId);
        setForceSingleTableRefresh(true);
    };

    const resetSingleTableForceRefresh = () => {
        setForceSingleTableRefresh(false);
    };

    const goToRevision = orgUnitRevision => {
        // FIXME: Only send the modified fields and do the merge server side
        const mappedRevision = {
            ...currentOrgUnit,
            ...orgUnitRevision.fields,
            geo_json: null,
            aliases: orgUnitRevision.fields.aliases
                ? getAliasesArrayFromString(orgUnitRevision.fields.aliases)
                : currentOrgUnit.aliases,
            id: currentOrgUnit.id,
        };
        // Retrieve only the group ids as it's what the API expect
        const group_ids = mappedRevision.groups.map(g => g.id);
        mappedRevision.groups = group_ids;
        const { saveOrgUnit } = props;
        return saveOrgUnit(mappedRevision).then(newCurrentOrgUnit => {
            props.resetOrgUnits();
            props.setCurrentOrgUnit(newCurrentOrgUnit);
        });
    };

    const validateLink = (link, handleFetch) => {
        const newLink = {
            ...link,
            validated: !link.validated,
        };
        saveLink(dispatch, newLink).then(() => handleFetch());
    };

    const handleChangeTab = useCallback(
        (newTab, redirect = true) => {
            if (redirect) {
                const newParams = {
                    ...params,
                    tab: newTab,
                };
                redirectTo(baseUrl, newParams);
            }
            setTab(newTab);
        },
        [params, redirectTo],
    );

    const handleChangeShape = (geoJson, key) => {
        setOrgUnitLocationModified(true);
        props.setCurrentOrgUnit({
            ...currentOrgUnit,
            [key]: geoJson,
        });
    };

    const handleChangeLocation = location => {
        // TODO not sure why, perhaps to remove decimals
        const convert = pos =>
            pos !== null ? parseFloat(pos.toFixed(8)) : null;
        const newPos = {
            altitude: location.alt ? convert(location.alt) : 0,
        };
        // only update dimensions that are presents
        if (location.lng !== undefined) {
            newPos.longitude = convert(location.lng);
        }
        if (location.lat !== undefined) {
            newPos.latitude = convert(location.lat);
        }
        setOrgUnitLocationModified(true);
        props.setCurrentOrgUnit({
            ...currentOrgUnit,
            ...newPos,
        });
    };

    const handleSaveOrgUnit = (newOrgUnit = {}) => {
        let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });
        orgUnitPayload = {
            ...orgUnitPayload,
            groups:
                orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                    ? orgUnitPayload.groups
                    : orgUnitPayload.groups.map(g => g.id),
        };
        const { saveOrgUnit, createOrgUnit } = props;

        const isNew = currentOrgUnit && !currentOrgUnit.id;
        const savePromise = isNew
            ? createOrgUnit(orgUnitPayload)
            : saveOrgUnit(orgUnitPayload);
        return savePromise
            .then(savedOrgUnit => {
                setOrgUnitLocationModified(false, savedOrgUnit);

                props.resetOrgUnits();
                props.setCurrentOrgUnit(savedOrgUnit);
                if (isNew) {
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
    };

    useEffect(() => {
        props.fetchUsersProfiles();
        fetchAlgorithms(dispatch).then(algoList =>
            props.setAlgorithms(algoList),
        );
        fetchAlgorithmRuns(dispatch).then(algoRunsList =>
            props.setAlgorithmRuns(algoRunsList),
        );
        fetchGroups(dispatch, params.orgUnitId === '0').then(newGroups =>
            props.setGroups(newGroups),
        );

        const promisesArray = [fetchOrgUnitsTypes(dispatch)];
        if (params.orgUnitId !== '0') {
            promisesArray.push(
                fetchAssociatedDataSources(dispatch, params.orgUnitId),
            );
            promisesArray.push(
                fetchLinks(
                    dispatch,
                    `/api/links/?orgUnitId=${params.orgUnitId}`,
                ),
            );
        } else {
            promisesArray.push(fetchSources(dispatch));
        }

        Promise.all(promisesArray).then(
            ([newOrgUnitTypes, newSources, { links } = []]) => {
                props.setOrgUnitTypes(
                    newOrgUnitTypes.map((ot, i) => ({
                        ...ot,
                        color: getOtChipColors(i),
                    })),
                );
                const coloredSources = newSources.map((s, i) => ({
                    ...s,
                    color: getChipColors(i),
                }));
                props.setSources(coloredSources);
                fetchDetail().then(async orgUnit => {
                    const selectedSources = getLinksSources(
                        links,
                        coloredSources,
                        orgUnit,
                    );
                    const fullSelectedSources = [];
                    for (let i = 0; i < selectedSources.length; i += 1) {
                        const ss = selectedSources[i];
                        // eslint-disable-next-line no-await-in-loop
                        const detail = await fetchAssociatedOrgUnits(
                            dispatch,
                            ss,
                            orgUnit,
                        );
                        fullSelectedSources.push(detail);
                    }
                    props.setCurrentOrgUnit(orgUnit);
                    setSourcesSelected(fullSelectedSources);
                    dispatch(setFetchingDetail(false));
                });
            },
        );
    }, []);

    return (
        <section className={classes.root}>
            <TopBar
                title={title}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
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
                        onChange={(event, newtab) => handleChangeTab(newtab)}
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
            {fetching && <LoadingSpinner />}
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
                                onResetOrgUnit={() => handleResetOrgUnit()}
                                saveOrgUnit={newOrgUnit =>
                                    handleSaveOrgUnit(newOrgUnit)
                                }
                                params={params}
                                baseUrl={baseUrl}
                            />
                        </Box>
                    )}
                    <div className={tab === 'map' ? '' : classes.hiddenOpacity}>
                        <Box className={classes.containerFullHeight}>
                            <OrgUnitMap
                                sourcesSelected={sourcesSelected}
                                setSourcesSelected={newSourcesSelected => {
                                    setSourcesSelected(newSourcesSelected);
                                }}
                                setOrgUnitLocationModified={isModified =>
                                    setOrgUnitLocationModified(isModified)
                                }
                                orgUnitLocationModified={
                                    orgUnitLocationModified
                                }
                                orgUnit={currentOrgUnit}
                                resetOrgUnit={() => handleResetOrgUnit()}
                                saveOrgUnit={() => handleSaveOrgUnit()}
                                onChangeLocation={location => {
                                    handleChangeLocation(location);
                                }}
                                onChangeShape={(key, geoJson) =>
                                    handleChangeShape(geoJson, key)
                                }
                            />
                        </Box>
                    </div>

                    {tab === 'history' && (
                        <Logs
                            params={params}
                            logObjectId={currentOrgUnit.id}
                            goToRevision={orgUnitRevision =>
                                goToRevision(orgUnitRevision)
                            }
                        />
                    )}
                    {tab === 'forms' && (
                        <SingleTable
                            paramsPrefix="formsParams"
                            apiParams={{
                                orgUnitId: currentOrgUnit.id,
                            }}
                            exportButtons={false}
                            baseUrl={baseUrl}
                            endPointPath="forms"
                            propsToWatch={params.tab}
                            fetchItems={fetchForms}
                            columns={formsTableColumns({
                                formatMessage,
                                user: currentUser,
                                deleteForm: handleDeleteForm,
                                orgUnitId: params.orgUnitId,
                            })}
                            forceRefresh={forceSingleTableRefresh}
                            onForceRefreshDone={() =>
                                resetSingleTableForceRefresh()
                            }
                        />
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
                                    params.orgUnitId,
                                ),
                            }}
                            propsToWatch={params.tab}
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
                        className={tab === 'links' ? '' : classes.hiddenOpacity}
                    >
                        <SingleTable
                            apiParams={{
                                orgUnitId: currentOrgUnit.id,
                            }}
                            propsToWatch={params.tab}
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
                                linksTableColumns(formatMessage, link =>
                                    validateLink(link, handleFetch),
                                )
                            }
                            subComponent={(link, handleFetch) =>
                                link ? (
                                    <LinksDetails
                                        linkId={link.id}
                                        validated={link.validated}
                                        validateLink={() =>
                                            validateLink(link, handleFetch)
                                        }
                                    />
                                ) : null
                            }
                        />
                    </div>
                    {tab === 'comments' && (
                        <Grid
                            container
                            justifyContent="center"
                            className={classes.commentsWrapper}
                        >
                            <Grid item xs={6}>
                                <OrgUnitsMapComments
                                    className={classes.comments}
                                    orgUnit={currentOrgUnit}
                                    maxPages={4}
                                />
                            </Grid>
                        </Grid>
                    )}
                </section>
            )}
        </section>
    );
};

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
    setOrgUnitTypes: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    redirectToPush: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    sources: PropTypes.array,
    prevPathname: PropTypes.any,
    groups: PropTypes.array.isRequired,
    setGroups: PropTypes.func.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
    createOrgUnit: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setAlgorithmRuns: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    algorithms: PropTypes.array.isRequired,
    algorithmRuns: PropTypes.array.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    prevPathname: state.routerCustom.prevPathname,
    groups: state.orgUnits.groups,
    profiles: state.users.list,
    algorithms: state.links.algorithmsList,
    algorithmRuns: state.links.algorithmRunsList,
    currentUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    redirectTo: (key, params) =>
        dispatch(replace(`${key}${createUrl(params, '')}`)),
    redirectToPush: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    setSources: sources => dispatch(setSources(sources)),
    setGroups: groups => dispatch(setGroups(groups)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
    setAlgorithmRuns: algoRunsList => dispatch(setAlgorithmRuns(algoRunsList)),
    ...bindActionCreators(
        {
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
