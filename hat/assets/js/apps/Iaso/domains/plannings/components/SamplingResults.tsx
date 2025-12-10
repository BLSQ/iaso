import React, { FunctionComponent, useMemo } from 'react';

import { Box, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';

import { OpenhexaIntegrationDrawer } from 'Iaso/domains/assignments/sampling/OpenhexaIntegrationDrawer';
import { useGetOrgUnitTypesHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { flattenHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning } from 'Iaso/domains/plannings/types';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useSamplingResultsColumns } from '../config';
import {
    tableDefaults,
    useGetPlanningSamplingResults,
} from '../hooks/requests/useGetPlanningSamplingResults';
import MESSAGES from '../messages';

type Props = {
    planning: Planning;
};

export const SamplingResults: FunctionComponent<Props> = ({ planning }) => {
    const params = useParamsObject(baseUrls.planningDetails);
    const { formatMessage } = useSafeIntl();

    const { data: samplingResults, isFetching: isFetchingSamplingResults } =
        useGetPlanningSamplingResults(`${planning.id}`, params);

    const columns = useSamplingResultsColumns(planning);

    const { data: orgUnitTypeHierarchy, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypesHierarchy(
            planning?.org_unit_details?.org_unit_type || 0,
        );
    const orgunitTypes = useMemo(
        () => flattenHierarchy(orgUnitTypeHierarchy?.sub_unit_types || []),
        [orgUnitTypeHierarchy],
    );

    return (
        <Box mt={2}>
            <Grid container spacing={2}>
                <Grid item xs={8}>
                    <Typography color="primary" variant="h6">
                        {formatMessage(MESSAGES.samplingResults)}
                    </Typography>
                </Grid>
                <Grid
                    item
                    xs={4}
                    sx={{ display: 'flex', justifyContent: 'flex-end' }}
                >
                    {planning && planning?.pipeline_uuids?.length > 0 && (
                        <OpenhexaIntegrationDrawer
                            planning={planning}
                            orgunitTypes={orgunitTypes}
                            isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                        />
                    )}
                </Grid>
            </Grid>
            <TableWithDeepLink
                baseUrl={baseUrls.planningDetails}
                data={samplingResults?.results ?? []}
                params={params}
                defaultSorted={[{ id: 'created_at', desc: true }]}
                pages={samplingResults?.pages ?? tableDefaults.page}
                count={samplingResults?.count ?? 0}
                columns={columns}
                countOnTop={false}
                extraProps={{
                    loading: isFetchingSamplingResults,
                    defaultPageSize: tableDefaults.limit,
                }}
            />
        </Box>
    );
};
