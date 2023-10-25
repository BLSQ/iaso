/* eslint-disable camelcase */
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { alpha } from '@mui/material/styles';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import Logs from '../../components/logs/LogsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import {
    linksFiltersWithPrefix,
    onlyChildrenParams,
    orgUnitFiltersWithPrefix,
} from '../../constants/filters';
import { redirectTo, redirectToReplace } from '../../routing/actions.ts';
import { baseUrls } from '../../constants/urls';
import {
    deleteForm,
    fetchAssociatedOrgUnits,
    fetchForms,
    fetchLinks,
    fetchOrgUnitsList,
    saveLink,
} from '../../utils/requests';
import formsTableColumns from '../forms/config';
import LinksDetails from '../links/components/LinksDetailsComponent';
import { linksTableColumns } from '../links/config';
import { resetOrgUnits } from './actions';
import { OrgUnitForm } from './components/OrgUnitForm.tsx';
import { OrgUnitMap } from './components/orgUnitMap/OrgUnitMap/OrgUnitMap.tsx';
import { OrgUnitsMapComments } from './components/orgUnitMap/OrgUnitsMapComments';
import { useOrgUnitsTableColumns } from './config';
import {
    useOrgUnitDetailData,
    useRefreshOrgUnit,
    useSaveOrgUnit,
} from './hooks';
import { useGetValidationStatus } from '../forms/hooks/useGetValidationStatus.ts';
import MESSAGES from './messages';
import {
    getAliasesArrayFromString,
    getLinksSources,
    getOrgUnitsTree,
    getOrgUnitsUrl,
} from './utils';
import { useCurrentUser } from '../../utils/usersUtils.ts';

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
    const { mutateAsync: saveOu, isLoading: savingOu } = useSaveOrgUnit();
    const queryClient = useQueryClient();
    const { formatMessage } = useSafeIntl();
    const refreshOrgUnitQueryCache = useRefreshOrgUnit();
    const childrenColumns = useOrgUnitsTableColumns(classes);
    const prevPathname =
        useSelector(state => state.routerCustom.prevPathname) || null;
    const currentUser = useCurrentUser();

    const [currentOrgUnit, setCurrentOrgUnit] = useState(null);
    const [tab, setTab] = useState(params.tab ? params.tab : 'infos');
    const [sourcesSelected, setSourcesSelected] = useState(undefined);
    const [loadingSelectedSources, setLoadingSelectedSources] =
        useState(undefined);
    const [orgUnitLocationModified, setOrgUnitLocationModified] =
        useState(false);
    const [forceSingleTableRefresh, setForceSingleTableRefresh] =
        useState(false);

    const isNewOrgunit = useMemo(
        () => params.orgUnitId === '0',
        [params.orgUnitId],
    );

    const {
        data: validationStatusOptions,
        isLoading: isLoadingValidationStatusOptions,
    } = useGetValidationStatus(true, tab === 'children');
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

    const handleResetOrgUnit = async () => {
        const newParams = {
            ...params,
            levels: null,
        };
        dispatch(redirectToReplace(baseUrl, newParams));
        queryClient.invalidateQueries('currentOrgUnit');
    };

    const handleDeleteForm = useCallback(
        async formId => {
            await deleteForm(dispatch, formId);
            setForceSingleTableRefresh(true);
        },
        [dispatch],
    );

    const resetSingleTableForceRefresh = () => {
        setForceSingleTableRefresh(false);
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

    const handleChangeShape = useCallback(
        (geoJson, key) => {
            setOrgUnitLocationModified(true);
            setCurrentOrgUnit({
                ...currentOrgUnit,
                [key]: geoJson,
            });
        },
        [currentOrgUnit],
    );
    const handleChangeLocation = useCallback(
        location => {
            setOrgUnitLocationModified(true);
            const { latitude, longitude, altitude } = location;
            setCurrentOrgUnit({
                ...currentOrgUnit,
                altitude,
                longitude,
                latitude,
            });
        },
        [currentOrgUnit],
    );

    const {
        algorithms,
        algorithmRuns,
        groups,
        profiles,
        orgUnitTypes,
        links,
        sources,
        isFetchingDatas,
        originalOrgUnit,
        isFetchingDetail,
        isFetchingOrgUnitTypes,
        isFetchingGroups,
        isFetchingProfiles,
        parentOrgUnit,
    } = useOrgUnitDetailData(
        isNewOrgunit,
        params.orgUnitId,
        setCurrentOrgUnit,
        params.levels,
        tab,
    );

    const goToRevision = useCallback(
        (orgUnitRevision, onSuccess) => {
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
            saveOu(mappedRevision).then(res => {
                dispatch(resetOrgUnits());
                refreshOrgUnitQueryCache(res);
                onSuccess();
            });
        },
        [currentOrgUnit, dispatch, refreshOrgUnitQueryCache, saveOu],
    );

    const handleSaveOrgUnit = useCallback(
        (newOrgUnit = {}, onSuccess = () => {}, onError = () => {}) => {
            let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });
            orgUnitPayload = {
                ...orgUnitPayload,
                groups:
                    orgUnitPayload.groups.length > 0 &&
                    !orgUnitPayload.groups[0].id
                        ? orgUnitPayload.groups
                        : orgUnitPayload.groups.map(g => g.id),
            };
            saveOu(orgUnitPayload)
                .then(ou => {
                    setCurrentOrgUnit(ou);
                    setOrgUnitLocationModified(false);
                    dispatch(resetOrgUnits());
                    if (isNewOrgunit) {
                        dispatch(
                            redirectToReplace(baseUrl, {
                                ...params,
                                orgUnitId: ou.id,
                            }),
                        );
                    }
                    refreshOrgUnitQueryCache(ou);
                    onSuccess(ou);
                })
                .catch(onError);
        },
        [
            currentOrgUnit,
            dispatch,
            isNewOrgunit,
            params,
            refreshOrgUnitQueryCache,
            saveOu,
        ],
    );

    useEffect(() => {
        if (isNewOrgunit && !currentOrgUnit) {
            if (params.levels && parentOrgUnit) {
                setCurrentOrgUnit({
                    ...initialOrgUnit,
                    parent: parentOrgUnit,
                });
            } else if (!params.levels) {
                setCurrentOrgUnit(initialOrgUnit);
            }
        }
    }, [parentOrgUnit, isNewOrgunit, params.levels, currentOrgUnit]);

    // Set levels params in the url
    useEffect(() => {
        if (originalOrgUnit && !isNewOrgunit && !params.levels) {
            const orgUnitTree = getOrgUnitsTree(originalOrgUnit);
            if (orgUnitTree.length > 0) {
                const levels = orgUnitTree.map(o => o.id);
                const newParams = {
                    ...params,
                    levels,
                };
                if (params.levels !== levels.join(',') && levels.length > 0) {
                    dispatch(redirectToReplace(baseUrl, newParams));
                }
            }
        }
    }, [originalOrgUnit, dispatch, isNewOrgunit, params]);

    // Set selected sources for current org unit
    useEffect(() => {
        if (originalOrgUnit && !isNewOrgunit && !sourcesSelected) {
            const selectedSources = getLinksSources(
                links,
                sources,
                originalOrgUnit,
            );
            const fullSelectedSources = [];
            if (selectedSources.length === 0) {
                setLoadingSelectedSources(false);
            }
            for (let i = 0; i < selectedSources.length; i += 1) {
                const ss = selectedSources[i];
                setLoadingSelectedSources(true);
                // eslint-disable-next-line no-await-in-loop
                const fetch = async () => {
                    const ous = await fetchAssociatedOrgUnits(
                        dispatch,
                        ss,
                        originalOrgUnit,
                    );
                    fullSelectedSources.push(ous);
                    if (i + 1 === selectedSources.length) {
                        setSourcesSelected(fullSelectedSources);
                        setLoadingSelectedSources(false);
                    }
                };
                fetch();
            }
        }
    }, [
        originalOrgUnit,
        dispatch,
        links,
        sources,
        isNewOrgunit,
        sourcesSelected,
    ]);
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
                        dispatch(
                            redirectTo(getOrgUnitsUrl(params.accountId), {}),
                        );
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

            {(isFetchingDetail || isFetchingDatas || savingOu) &&
                (tab === 'infos' || tab === 'map' || tab === 'comments') && (
                    <LoadingSpinner />
                )}
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
                                saveOrgUnit={handleSaveOrgUnit}
                                params={params}
                                baseUrl={baseUrl}
                                isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
                                isFetchingGroups={isFetchingGroups}
                            />
                        </Box>
                    )}
                    {!isNewOrgunit && (
                        <>
                            <div
                                className={
                                    tab === 'map' ? '' : classes.hiddenOpacity
                                }
                            >
                                <Box className={classes.containerFullHeight}>
                                    {!isFetchingDetail && (
                                        <OrgUnitMap
                                            loadingSelectedSources={
                                                loadingSelectedSources
                                            }
                                            currentOrgUnit={currentOrgUnit}
                                            sources={sources}
                                            orgUnitTypes={orgUnitTypes}
                                            sourcesSelected={sourcesSelected}
                                            setSourcesSelected={newSourcesSelected => {
                                                setSourcesSelected(
                                                    newSourcesSelected,
                                                );
                                            }}
                                            setOrgUnitLocationModified={isModified =>
                                                setOrgUnitLocationModified(
                                                    isModified,
                                                )
                                            }
                                            orgUnitLocationModified={
                                                orgUnitLocationModified
                                            }
                                            resetOrgUnit={() =>
                                                handleResetOrgUnit()
                                            }
                                            saveOrgUnit={() =>
                                                handleSaveOrgUnit()
                                            }
                                            onChangeLocation={
                                                handleChangeLocation
                                            }
                                            onChangeShape={(key, geoJson) =>
                                                handleChangeShape(geoJson, key)
                                            }
                                        />
                                    )}
                                </Box>
                            </div>

                            {tab === 'history' && (
                                <div data-test="logs-tab">
                                    <Logs
                                        params={params}
                                        logObjectId={currentOrgUnit.id}
                                        goToRevision={goToRevision}
                                    />
                                </div>
                            )}
                            {tab === 'forms' && (
                                <div data-test="forms-tab">
                                    <SingleTable
                                        paramsPrefix="formsParams"
                                        apiParams={{
                                            orgUnitId: currentOrgUnit.id,
                                        }}
                                        hideGpkg
                                        exportButtons={false}
                                        baseUrl={baseUrl}
                                        endPointPath="forms"
                                        propsToWatch={params.orgUnitId}
                                        fetchItems={fetchForms}
                                        columns={formsTableColumns({
                                            formatMessage,
                                            user: currentUser,
                                            deleteForm: handleDeleteForm,
                                            orgUnitId: params.orgUnitId,
                                            dispatch,
                                        })}
                                        forceRefresh={forceSingleTableRefresh}
                                        onForceRefreshDone={() =>
                                            resetSingleTableForceRefresh()
                                        }
                                    />
                                </div>
                            )}
                            <div
                                data-test="children-tab"
                                className={
                                    tab === 'children'
                                        ? ''
                                        : classes.hiddenOpacity
                                }
                            >
                                <SingleTable
                                    apiParams={{
                                        ...onlyChildrenParams(
                                            'childrenParams',
                                            params,
                                            params.orgUnitId,
                                        ),
                                    }}
                                    propsToWatch={params.orgUnitId}
                                    filters={orgUnitFiltersWithPrefix(
                                        'childrenParams',
                                        true,
                                        formatMessage,
                                        groups,
                                        orgUnitTypes,
                                        validationStatusOptions,
                                        isLoadingValidationStatusOptions,
                                    )}
                                    params={params}
                                    paramsPrefix="childrenParams"
                                    baseUrl={baseUrl}
                                    endPointPath="orgunits"
                                    fetchItems={fetchOrgUnitsList}
                                    columns={childrenColumns}
                                />
                            </div>
                            <div
                                data-test="links-tab"
                                className={
                                    tab === 'links' ? '' : classes.hiddenOpacity
                                }
                            >
                                <SingleTable
                                    apiParams={{
                                        orgUnitId: params.orgUnitId,
                                    }}
                                    propsToWatch={params.orgUnitId}
                                    filters={linksFiltersWithPrefix(
                                        'linksParams',
                                        algorithmRuns,
                                        formatMessage,
                                        profiles,
                                        algorithms,
                                        sources,
                                        isFetchingProfiles,
                                    )}
                                    params={params}
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
                                                    validateLink(
                                                        link,
                                                        handleFetch,
                                                    )
                                                }
                                            />
                                        ) : null
                                    }
                                    hideGpkg
                                />
                            </div>
                            {tab === 'comments' && (
                                <div data-test="comments-tab">
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
                        </>
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
