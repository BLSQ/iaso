import React, { FunctionComponent, useMemo } from 'react';
import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { orderBy } from 'lodash';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { baseUrls } from '../../constants/urls';
import { getOtChipColors } from '../../constants/chipColors';

import { useGetOrgUnit } from './hooks/useGetOrgUnit';

import { Instances } from './components/Instances';
import { OrgUnitPaper } from './components/OrgUnitPaper';
import { OrgUnitInstances } from './components/OrgUnitInstances';

import { OrgunitTypes } from '../orgUnits/types/orgunitTypes';
import { RegistryDetailParams } from './types';

import { OrgUnitBreadcrumbs } from '../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';

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
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.registry, { accountId });

    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);

    const subOrgUnitTypes: OrgunitTypes = useMemo(() => {
        const options =
            orgUnit?.org_unit_type?.sub_unit_types.map((subType, index) => ({
                ...subType,
                color: getOtChipColors(index) as string,
            })) || [];
        return orderBy(options, [f => f.depth], ['asc']);
    }, [orgUnit]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isFetching && <LoadingSpinner />}

                {orgUnit && (
                    <Grid container spacing={2}>
                        {orgUnit && (
                            <Grid item xs={12}>
                                <OrgUnitBreadcrumbs
                                    orgUnit={orgUnit}
                                    showRegistry
                                    showOnlyParents
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} md={6}>
                            <OrgUnitPaper
                                orgUnit={orgUnit}
                                subOrgUnitTypes={subOrgUnitTypes}
                                params={params}
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
