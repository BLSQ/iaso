import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl
} from 'bluesquare-components';
import { orderBy } from 'lodash';
import React, { FunctionComponent, useMemo, useState } from 'react';
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
import {
    useGetOrgUnit,
    useGetOrgUnitListChildren,
    useGetOrgUnitsMapChildren,
} from './hooks/useGetOrgUnit';
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
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Registry: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrls.registry) as RegistryParams;
    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const { orgUnitId, orgUnitChildrenId } = params;
    const { formatMessage } = useSafeIntl();
    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);
    const [selectedChildrenId, setSelectedChildrenId] = useState<
        string | undefined
    >(orgUnitChildrenId);
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

    const handleOrgUnitChange = (newOrgUnit: OrgUnit) => {
        if (newOrgUnit) {
            const newParams = {
                ...params,
                orgUnitId: `${newOrgUnit.id}`,
            };
            delete newParams.orgUnitChildrenId;
            delete newParams.submissionId;
            setSelectedChildrenId(undefined);
            redirectTo(`/${baseUrls.registry}`, newParams);
        }
    };

    const handleChildrenChange = (newChildren: OrgUnit) => {
        const newParams = {
            ...params,
        };
        if (newChildren) {
            setSelectedChildrenId(`${newChildren.id}`);
            newParams.orgUnitChildrenId = `${newChildren.id}`;
        } else {
            setSelectedChildrenId(undefined);
            delete newParams.orgUnitChildrenId;
        }
        delete newParams.submissionId;
        redirectToReplace(`/${baseUrls.registry}`, newParams);
    };

    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}${
                    orgUnit
                        ? `: ${orgUnit.name} (${orgUnit.org_unit_type_name})`
                        : ''
                }`}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sx={styles.breadCrumbContainer}>
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
                        {orgUnitId && !isFetching && orgUnit && (
                            <OrgUnitBreadcrumbs
                                orgUnit={orgUnit}
                                showRegistry
                                showOnlyParents={false}
                            />
                        )}
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
