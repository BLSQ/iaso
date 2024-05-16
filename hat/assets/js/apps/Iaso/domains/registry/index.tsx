import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { orderBy } from 'lodash';
import React, { FunctionComponent, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { getOtChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';

import {
    useGetOrgUnit,
    useGetOrgUnitListChildren,
    useGetOrgUnitsMapChildren,
} from './hooks/useGetOrgUnit';

import { Instances } from './components/Instances';
import { OrgUnitPaper } from './components/OrgUnitPaper';
import { OrgunitTypeRegistry } from './types/orgunitTypes';

import { RegistryParams } from './types';

import { redirectTo, redirectToReplace } from '../../routing/actions';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnitBreadcrumbs } from '../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';
import { OrgUnit } from '../orgUnits/types/orgUnit';
import { SelectedOrgUnit } from './components/selectedOrgUnit';

type Router = {
    goBack: () => void;
    params: RegistryParams;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Registry: FunctionComponent<Props> = ({ router }) => {
    const {
        params: { orgUnitId, orgUnitChildrenId },
        params,
    } = router;
    const dispatch = useDispatch();

    const classes: Record<string, string> = useStyles();
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
            setSelectedChildrenId(undefined);
            dispatch(redirectTo(`/${baseUrls.registry}`, newParams));
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
        dispatch(redirectToReplace(`/${baseUrls.registry}`, newParams));
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
                {isFetching && <LoadingSpinner />}

                <Grid container spacing={2}>
                    <Grid container item xs={12}>
                        {orgUnitId && (
                            <Grid container item xs={6} alignItems="center">
                                {!isFetching && orgUnit && (
                                    <OrgUnitBreadcrumbs
                                        orgUnit={orgUnit}
                                        showRegistry
                                        showOnlyParents={false}
                                    />
                                )}
                            </Grid>
                        )}
                        <Grid item xs={6}>
                            <Box mb={-2}>
                                <OrgUnitTreeviewModal
                                    toggleOnLabelClick
                                    titleMessage={MESSAGES.search}
                                    onConfirm={handleOrgUnitChange}
                                    initialSelection={orgUnit}
                                    defaultOpen={!orgUnitId}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    {!isFetching && orgUnit && (
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
                <Box>
                    <Instances
                        isLoading={isFetching}
                        subOrgUnitTypes={subOrgUnitTypes}
                        params={params}
                    />
                </Box>
            </Box>
        </>
    );
};
