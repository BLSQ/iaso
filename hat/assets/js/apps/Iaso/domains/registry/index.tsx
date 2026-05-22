import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, Grid } from '@mui/material';
import {
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { orderBy } from 'lodash';
import { getColor, useGetColors } from 'Iaso/hooks/useGetColors';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { SxStyles } from '../../types/general';
import { OrgUnitBreadcrumbs } from '../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnit } from '../orgUnits/types/orgUnit';
import { Instances } from './components/Instances';
import { OrgUnitPaper } from './components/OrgUnitPaper';
import { Placeholder } from './components/Placeholder';
import { SelectedOrgUnit } from './components/selectedOrgUnit';
import {
    useGetOrgUnit,
    useGetOrgUnitListChildren,
    useGetOrgUnitsMapChildren,
} from './hooks/useGetOrgUnit';
import MESSAGES from './messages';
import { RegistryParams } from './types';
import { OrgunitTypeRegistry } from './types/orgunitTypes';

const styles: SxStyles = {
    breadCrumbContainer: { '& nav': { display: 'inline-block' } },
    treeContainer: {
        top: '-2px',
        position: 'relative',
        display: 'inline-block',
    },
    mainContainer: {
        width: '100%',
        height: 'calc(100vh - 65px)',
        margin: 0,
        padding: theme => theme.spacing(2, 4, 4, 4),
        overflow: 'auto',
        backgroundColor: 'white',
    },
    fullScreenBreadcrumb: {
        position: 'fixed',
        backgroundColor: 'white',
        height: '63px',
        width: '100vw',
        left: 0,
        paddingLeft: theme => theme.spacing(4),
        top: '64px',
        paddingTop: theme => theme.spacing(2),
        zIndex: 100,
        boxShadow:
            'inset 0px 2px 4px -1px rgba(0,0,0,0.2),inset 0px 4px 5px 0px rgba(0,0,0,0.14),inset 0px 1px 10px 0px rgba(0,0,0,0.12)',
    },
};

const baseUrl = baseUrls.registry;
export const Registry: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as RegistryParams;
    const { orgUnitId, orgUnitChildrenId, fullScreen } = params;
    const isFullScreen = fullScreen === 'true';
    const [selectedChildrenId, setSelectedChildrenId] = useState<
        string | undefined
    >(orgUnitChildrenId);
    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const { formatMessage } = useSafeIntl();
    const { data: colors } = useGetColors(true);
    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);
    const { data: selectedChildren, isFetching: isFetchingSelectedChildren } =
        useGetOrgUnit(selectedChildrenId);
    const { data: orgUnitListChildren, isFetching: isFetchingListChildren } =
        useGetOrgUnitListChildren(
            orgUnitId,
            params,
            orgUnit?.org_unit_type?.sub_unit_types,
        );
    const { data: orgUnitMapChildren, isFetching: isFetchingMapChildren } =
        useGetOrgUnitsMapChildren(
            orgUnitId,
            orgUnit?.org_unit_type?.sub_unit_types,
        );

    const subOrgUnitTypes: OrgunitTypeRegistry[] = useMemo(() => {
        if (!orgUnitMapChildren) {
            return [];
        }
        const options =
            orgUnit?.org_unit_type?.sub_unit_types.map((subType, index) => ({
                ...subType,
                color: getColor(index, colors),
                orgUnits: orgUnitMapChildren.filter(
                    subOrgUnit => subOrgUnit.org_unit_type_id === subType.id,
                ),
            })) || [];
        return orderBy(options, [f => f.depth], ['asc']);
    }, [orgUnit, orgUnitMapChildren, colors]);

    useSkipEffectOnMount(() => {
        setSelectedChildrenId(undefined);
    }, [orgUnitId]);

    const handleOrgUnitChange = useCallback(
        (newOrgUnit: OrgUnit) => {
            if (newOrgUnit?.id) {
                redirectTo(`/${baseUrl}`, { orgUnitId: `${newOrgUnit.id}` });
            }
        },
        [redirectTo],
    );

    const handleChildrenChange = useCallback(
        (newChildren: OrgUnit) => {
            const newParams = { ...params };
            // Need to check the id because clicking on the marker will somehow still pass
            // an object with the coordinates
            if (newChildren?.id) {
                setSelectedChildrenId(`${newChildren.id}`);
                newParams.orgUnitChildrenId = `${newChildren.id}`;
            } else {
                setSelectedChildrenId(undefined);
                // newParams.orgUnitChildrenId = undefined;
                delete newParams.orgUnitChildrenId;
            }
            newParams.submissionId = undefined;
            redirectToReplace(`/${baseUrl}`, newParams);
        },
        [params, redirectToReplace],
    );
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}${
                    orgUnit
                        ? `: ${orgUnit.name} (${orgUnit.org_unit_type_name})`
                        : ''
                }`}
            />
            <Box
                sx={{
                    ...styles.mainContainer,
                    overflow: isFullScreen ? 'hidden' : 'auto',
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12} sx={styles.breadCrumbContainer}>
                        <Box
                            sx={isFullScreen ? styles.fullScreenBreadcrumb : {}}
                        >
                            <Box sx={styles.treeContainer}>
                                <OrgUnitTreeviewModal
                                    toggleOnLabelClick
                                    titleMessage={MESSAGES.search}
                                    onConfirm={handleOrgUnitChange}
                                    initialSelection={orgUnit}
                                    defaultOpen={!orgUnitId}
                                    useIcon
                                />
                            </Box>
                            <Box display="inline-block" ml={1} mr={2}>
                                {`>`}
                            </Box>
                            {!orgUnitId && '...'}
                            {orgUnitId && orgUnit && (
                                <OrgUnitBreadcrumbs
                                    orgUnit={orgUnit}
                                    showRegistry
                                    showOnlyParents={false}
                                    params={{ orgUnitId }}
                                />
                            )}
                        </Box>
                    </Grid>
                    {orgUnit && (
                        <>
                            <Grid item xs={12} md={6}>
                                <OrgUnitPaper
                                    orgUnit={orgUnit}
                                    subOrgUnitTypes={subOrgUnitTypes}
                                    params={params}
                                    orgUnitListChildren={orgUnitListChildren}
                                    isFetchingListChildren={
                                        isFetchingListChildren
                                    }
                                    orgUnitMapChildren={orgUnitMapChildren}
                                    isFetchingMapChildren={
                                        isFetchingMapChildren
                                    }
                                    isFetchingOrgUnit={isFetching}
                                    setSelectedChildren={handleChildrenChange}
                                    handleOrgUnitChange={handleOrgUnitChange}
                                    selectedChildrenId={selectedChildrenId}
                                />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                md={6}
                                alignItems="flex-start"
                                container
                            >
                                {orgUnit && (
                                    <SelectedOrgUnit
                                        orgUnit={
                                            selectedChildrenId
                                                ? selectedChildren
                                                : orgUnit
                                        }
                                        isFetching={
                                            selectedChildrenId
                                                ? isFetchingSelectedChildren
                                                : isFetching
                                        }
                                        params={params}
                                    />
                                )}
                            </Grid>
                        </>
                    )}
                </Grid>
                <Instances
                    isLoading={isFetching}
                    subOrgUnitTypes={subOrgUnitTypes}
                    params={params}
                />
                {!orgUnitId && <Placeholder />}
            </Box>
        </>
    );
};
