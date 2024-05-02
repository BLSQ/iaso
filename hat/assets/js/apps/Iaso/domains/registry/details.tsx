import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { orderBy } from 'lodash';
import React, { FunctionComponent, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { getOtChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';
import { useGoBack } from '../../routing/useGoBack';

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

export const Details: FunctionComponent<Props> = ({ router }) => {
    const {
        params: { orgUnitId, accountId },
        params,
    } = router;
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.registry, { accountId });

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
        const newParams = {
            ...params,
            orgUnitId: `${newOrgUnit.id}`,
        };
        dispatch(redirectTo(`/${baseUrls.registryDetail}`, newParams));
    };

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isFetching && <LoadingSpinner />}

                {!isFetching && orgUnit && (
                    <Grid container spacing={2}>
                        {orgUnit && (
                            <>
                                <Grid item xs={12}>
                                    <OrgUnitBreadcrumbs
                                        orgUnit={orgUnit}
                                        showRegistry
                                        showOnlyParents
                                    />
                                </Grid>
                                <Grid container item xs={12}>
                                    <Grid item xs={4}>
                                        <Box mb={-2}>
                                            <OrgUnitTreeviewModal
                                                toggleOnLabelClick
                                                titleMessage={MESSAGES.search}
                                                onConfirm={handleOrgUnitChange}
                                                initialSelection={orgUnit}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}>
                            <OrgUnitPaper
                                orgUnit={orgUnit}
                                subOrgUnitTypes={subOrgUnitTypes}
                                params={params}
                                orgUnitListChildren={orgUnitListChildren}
                                isFetchingListChildren={isFetchingListChildren}
                                orgUnitMapChildren={orgUnitMapChildren}
                                isFetchingMapChildren={isFetchingMapChildren}
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
                                />
                            )}
                        </Grid>
                    </Grid>
                )}
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
