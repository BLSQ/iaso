import { Box, Grid } from '@mui/material';
import {
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { orderBy } from 'lodash';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import TopBar from '../../components/nav/TopBarComponent';
import { getOtChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { SxStyles } from '../../types/general';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnitBreadcrumbs } from '../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';
import { OrgUnit } from '../orgUnits/types/orgUnit';
import { Instances } from './components/Instances';
import { OrgUnitPaper } from './components/OrgUnitPaper';
import { Placeholder } from './components/Placeholder';
import { SelectedOrgUnit } from './components/selectedOrgUnit';
import { useGetForms } from './hooks/useGetForms';
import {
    useGetOrgUnit,
    useGetOrgUnitListChildren,
    useGetOrgUnitsMapChildren,
} from './hooks/useGetOrgUnit';
import { useGetOrgUnitType } from './hooks/useGetOrgUnitType';
import MESSAGES from './messages';
import { RegistryParams } from './types';
import { OrgunitTypeRegistry } from './types/orgunitTypes';

const styles: SxStyles = {
    breadCrumbContainer: {
        '& nav': {
            display: 'inline-block',
        },
    },
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
export const Registry: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.registry) as RegistryParams;
    const { orgUnitId, orgUnitChildrenId, formIds, tab, fullScreen } = params;
    const isFullScreen = fullScreen === 'true';
    const [selectedChildrenId, setSelectedChildrenId] = useState<
        string | undefined
    >(orgUnitChildrenId);

    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const { formatMessage } = useSafeIntl();

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
                color: getOtChipColors(index) as string,
                orgUnits: orgUnitMapChildren.filter(
                    subOrgUnit => subOrgUnit.org_unit_type_id === subType.id,
                ),
            })) || [];
        return orderBy(options, [f => f.depth], ['asc']);
    }, [orgUnit, orgUnitMapChildren]);

    const currentType: OrgunitTypeRegistry | undefined = useMemo(() => {
        if (subOrgUnitTypes.length > 0) {
            if (tab) {
                const existingType: OrgunitTypeRegistry | undefined =
                    subOrgUnitTypes.find(subType => `${subType.id}` === tab);
                return existingType || subOrgUnitTypes[0];
            }
            return subOrgUnitTypes[0];
        }
        return undefined;
    }, [subOrgUnitTypes, tab]);

    const { data: orgunitTypeDetail } = useGetOrgUnitType(currentType?.id);
    const { data: formsList, isFetching: isFetchingForms } = useGetForms({
        orgUnitTypeIds: currentType?.id,
    });

    const handleOrgUnitChange = useCallback(
        (newOrgUnit: OrgUnit) => {
            if (newOrgUnit) {
                const newParams = {
                    ...params,
                    orgUnitId: `${newOrgUnit.id}`,
                };
                redirectTo(`/${baseUrls.registry}`, newParams);
            }
        },
        [params, redirectTo],
    );

    const handleChildrenChange = useCallback(
        (newChildren: OrgUnit) => {
            const newParams = {
                ...params,
            };
            if (newChildren) {
                setSelectedChildrenId(`${newChildren.id}`);
                newParams.orgUnitChildrenId = `${newChildren.id}`;
            } else {
                setSelectedChildrenId(undefined);
                newParams.orgUnitChildrenId = undefined;
            }
            newParams.submissionId = undefined;
            redirectToReplace(`/${baseUrls.registry}`, newParams);
        },
        [params, redirectToReplace],
    );

    useEffect(() => {
        if (
            orgUnitId &&
            (params.orgUnitChildrenId || params.submissionId || params.formIds)
        ) {
            const newParams = {
                ...params,
            };
            newParams.orgUnitChildrenId = undefined;
            newParams.submissionId = undefined;
            newParams.formIds = undefined;
            setSelectedChildrenId(undefined);
            redirectTo(`/${baseUrls.registry}`, newParams);
        }
        // Only remove selected children or submission if org unit change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgUnitId]);

    useEffect(() => {
        if (
            formsList &&
            (formsList?.length ?? 0) >= 0 &&
            !isFetchingForms &&
            !formIds &&
            orgunitTypeDetail
        ) {
            const selectedForm =
                orgunitTypeDetail.reference_forms.length > 0
                    ? `${orgunitTypeDetail.reference_forms[0].id}`
                    : formsList[0].value;
            const newParams = {
                ...params,
                formIds: selectedForm,
            };
            redirectToReplace(baseUrls.registry, newParams);
        }
        // only preselect a form if forms list contain an element and params is empty
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formsList, isFetchingForms, orgunitTypeDetail]);

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
                                    params={params}
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
                    currentType={currentType}
                    formsList={formsList}
                    isFetchingForms={isFetchingForms}
                />
                {!orgUnitId && <Placeholder />}
            </Box>
        </>
    );
};
