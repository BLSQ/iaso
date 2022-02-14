/* eslint-disable camelcase */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import omit from 'lodash/omit';
import { useSelector, useDispatch } from 'react-redux';

import { makeStyles, Box, Tabs, Tab, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { alpha } from '@material-ui/core/styles/colorManipulator';
import { redirectToReplace, redirectTo } from '../../routing/actions';
import TopBar from '../../components/nav/TopBarComponent';
import {
    setCurrentOrgUnit,
    setOrgUnitTypes,
    resetOrgUnits,
    setSources,
    setGroups,
    setFetchingDetail,
    saveOrgUnit,
    createOrgUnit,
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
import { fetchUsersProfiles } from '../users/actions';

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
const useStyles = makeStyles(theme => ({
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
}));
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

const OrgUnitDetail = ({ params, router }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    const fetching = useSelector(state => state.orgUnits.fetchingDetail);
    const currentOrgUnit = useSelector(state => state.orgUnits.current);
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const sources = useSelector(state => state.orgUnits.sources) || [];
    const prevPathname =
        useSelector(state => state.routerCustom.prevPathname) || null;
    const groups = useSelector(state => state.orgUnits.groups);
    const profiles = useSelector(state => state.users.list);
    const algorithms = useSelector(state => state.links.algorithmsList);
    const algorithmRuns = useSelector(state => state.links.algorithmRunsList);
    const currentUser = useSelector(state => state.users.current);

    const [tab, setTab] = useState(params.tab ? params.tab : 'infos');
    const [sourcesSelected, setSourcesSelected] = useState(undefined);
    const [orgUnitLocationModified, setOrgUnitLocationModified] =
        useState(false);
    const [forceSingleTableRefresh, setForceSingleTableRefresh] =
        useState(false);

    const isNewOrgunit = useMemo(
        () => params.orgUnitId === '0',
        [params.orgUnitId],
    );

    const title = useMemo(() => {
        if (isNewOrgunit) {
            return formatMessage(MESSAGES.newOrgUnit);
        }
        if (currentOrgUnit?.org_unit_type_name) {
            return (
                `${currentOrgUnit?.name}${
                    currentOrgUnit.org_unit_type_name
                        ? ` - ${currentOrgUnit.org_unit_type_name}`
                        : ''
                }` ?? ''
            );
        }
        return currentOrgUnit?.name ?? '';
    }, [
        currentOrgUnit?.name,
        currentOrgUnit?.org_unit_type_name,
        formatMessage,
        isNewOrgunit,
    ]);

    const fetchDetail = useCallback(() => {
        const { orgUnitId } = params;
        if (!isNewOrgunit) {
            return fetchOrgUnitDetail(dispatch, orgUnitId).then(orgUnit => {
                const orgUnitTree = getOrgUnitsTree(orgUnit);
                if (orgUnitTree.length > 0) {
                    const levels = orgUnitTree.map(o => o.id);
                    const newParams = {
                        ...params,
                        levels,
                    };
                    dispatch(redirectToReplace(baseUrl, newParams));
                }
                dispatch(setCurrentOrgUnit(orgUnit));
                return orgUnit;
            });
        }
        dispatch(setCurrentOrgUnit(initialOrgUnit));
        return new Promise(resolve => resolve());
    }, [dispatch, params, isNewOrgunit]);

    const handleResetOrgUnit = async () => {
        const newParams = {
            ...params,
            levels: null,
        };
        dispatch(redirectToReplace(baseUrl, newParams));

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
        return dispatch(
            saveOrgUnit(mappedRevision).then(newCurrentOrgUnit => {
                dispatch(resetOrgUnits());
                dispatch(setCurrentOrgUnit(newCurrentOrgUnit));
            }),
        );
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
                dispatch(redirectToReplace(baseUrl, newParams));
            }
            setTab(newTab);
        },
        [params, dispatch],
    );

    const handleChangeShape = (geoJson, key) => {
        setOrgUnitLocationModified(true);
        dispatch(
            setCurrentOrgUnit({
                ...currentOrgUnit,
                [key]: geoJson,
            }),
        );
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
        dispatch(
            setCurrentOrgUnit({
                ...currentOrgUnit,
                ...newPos,
            }),
        );
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

        const isNew = currentOrgUnit && !currentOrgUnit.id;
        const savePromise = isNew
            ? dispatch(createOrgUnit(orgUnitPayload))
            : dispatch(saveOrgUnit(orgUnitPayload));
        return savePromise
            .then(savedOrgUnit => {
                setOrgUnitLocationModified(false, savedOrgUnit);

                dispatch(resetOrgUnits());
                dispatch(setCurrentOrgUnit(savedOrgUnit));
                if (isNew) {
                    dispatch(
                        redirectToReplace(baseUrl, {
                            ...params,
                            orgUnitId: savedOrgUnit.id,
                        }),
                    );
                }
                return savedOrgUnit;
            })
            .catch(err => {
                throw err;
            });
    };

    useEffect(() => {
        dispatch(fetchUsersProfiles());
        fetchAlgorithms(dispatch).then(algoList =>
            dispatch(setAlgorithms(algoList)),
        );
        fetchAlgorithmRuns(dispatch).then(algoRunsList =>
            dispatch(setAlgorithmRuns(algoRunsList)),
        );
        fetchGroups(dispatch, params.orgUnitId === '0').then(newGroups =>
            dispatch(setGroups(newGroups)),
        );

        const promisesArray = [fetchOrgUnitsTypes(dispatch)];
        if (!isNewOrgunit) {
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
                dispatch(
                    setOrgUnitTypes(
                        newOrgUnitTypes.map((ot, i) => ({
                            ...ot,
                            color: getOtChipColors(i),
                        })),
                    ),
                );
                const coloredSources = newSources.map((s, i) => ({
                    ...s,
                    color: getChipColors(i),
                }));
                dispatch(setSources(coloredSources));
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
                    dispatch(setCurrentOrgUnit(orgUnit));
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
                        dispatch(redirectTo(baseUrls.orgUnits, {}));
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
                        <div id="logs-tab">
                            <Logs
                                params={params}
                                logObjectId={currentOrgUnit.id}
                                goToRevision={orgUnitRevision =>
                                    goToRevision(orgUnitRevision)
                                }
                            />
                        </div>
                    )}
                    {tab === 'forms' && (
                        <div id="forms-tab">
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
                        </div>
                    )}
                    <div
                        id="children-tab"
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
                        id="links-tab"
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
                        <div id="comments-tab">
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
                        </div>
                    )}
                </section>
            )}
        </section>
    );
};

OrgUnitDetail.propTypes = {
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

export default OrgUnitDetail;
