import React, { FunctionComponent, useMemo } from 'react';

import { Paper, Box, Divider } from '@mui/material';
import { Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';

import { OpenhexaIntegrationDrawer } from 'Iaso/domains/assignments/sampling/OpenhexaIntegrationDrawer';
import { useGetOrgUnitTypesHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { flattenHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning } from 'Iaso/domains/plannings/types';
import { SxStyles } from 'Iaso/types/general';
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
const styles: SxStyles = {
    paper: {
        px: 0,
        mt: 2,
        border: theme =>
            // @ts-ignore
            `1px solid ${theme.palette.border.main}`,
        borderRadius: 1,
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
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
        <Paper sx={styles.paper}>
            <Grid container spacing={2}>
                <Grid item xs={8}>
                    <Typography
                        color="primary"
                        variant="h6"
                        sx={{ px: 2, pt: 2 }}
                    >
                        {formatMessage(MESSAGES.samplingResults)}
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    {planning && planning?.pipeline_uuids?.length > 0 && (
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                width: '100%',
                            }}
                        >
                            <OpenhexaIntegrationDrawer
                                planning={planning}
                                orgunitTypes={orgunitTypes}
                                isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                            />
                        </Box>
                    )}
                </Grid>
            </Grid>
            <Divider />
            <TableWithDeepLink
                marginBottom={false}
                marginTop={false}
                baseUrl={baseUrls.planningDetails}
                data={samplingResults?.results ?? []}
                params={params}
                defaultSorted={[{ id: 'created_at', desc: true }]}
                pages={samplingResults?.pages ?? tableDefaults.page}
                count={samplingResults?.count ?? 0}
                columns={columns}
                elevation={0}
                countOnTop={false}
                extraProps={{
                    loading: isFetchingSamplingResults,
                    defaultPageSize: tableDefaults.limit,
                    planning,
                }}
            />
        </Paper>
    );
};
