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
import { OrgUnitInstances } from './components/OrgUnitInstances';
import { OrgUnitPaper } from './components/OrgUnitPaper';
import { OrgunitTypeRegistry } from './types/orgunitTypes';

import { RegistryDetailParams } from './types';

import { redirectTo } from '../../routing/actions';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnitBreadcrumbs } from '../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';
import { OrgUnit } from '../orgUnits/types/orgUnit';

type Router = {
    goBack: () => void;
    params: RegistryDetailParams;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Registry: FunctionComponent<Props> = ({ router }) => {
    const {
        params: { orgUnitId },
        params,
    } = router;
    const dispatch = useDispatch();

    const [selectedChildren, setSelectedChildren] = useState<
        OrgUnit | undefined
    >();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);
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
            dispatch(redirectTo(`/${baseUrls.registry}`, newParams));
        }
    };

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isFetching && <LoadingSpinner />}

                <Grid container spacing={2}>
                    {!isFetching && orgUnit && (
                        <Grid item xs={12}>
                            <OrgUnitBreadcrumbs
                                orgUnit={orgUnit}
                                showRegistry
                                showOnlyParents
                            />
                        </Grid>
                    )}
                    <Grid container item xs={12}>
                        <Grid item xs={4}>
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
                                    setSelectedChildren={setSelectedChildren}
                                    selectedChildren={selectedChildren}
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
                                    <OrgUnitInstances
                                        orgUnit={orgUnit}
                                        params={params}
                                        selectedChildren={selectedChildren}
                                    />
                                )}
                            </Grid>
                        </>
                    )}
                </Grid>
                <Box mt={2}>
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
