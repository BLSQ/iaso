import React, { FunctionComponent } from 'react';
import { Table } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { Round } from '../../../constants/types';
import { useTableState } from '../../../../../../../hat/assets/js/apps/Iaso/utils/table';
import { useGetSubActivities } from './hooks/api/useGetSubActivities';
import { useSubActivitiesColumns } from './hooks/useSubActivitiesColumns';
import { CreateSubActivity } from './components/Modal/CreateEditSubActivity';
import { RoundDates } from './components/RoundDates';

type Props = { round?: Round };

// It's not really a form, but it's named so to keep in line with other polio tabs
export const SubActivityForm: FunctionComponent<Props> = ({ round }) => {
    const { params, onTableParamsChange } = useTableState();
    const { data: subActivities, isFetching: loading } = useGetSubActivities({
        round,
        params,
    });
    const columns = useSubActivitiesColumns(round);
    return (
        <>
            <Box ml={2} mt={4} mb={-4}>
                <Grid container spacing={2}>
                    <Grid item xs={8}>
                        <RoundDates round={round} />
                    </Grid>
                    <Grid container item xs={4} justifyContent="flex-end">
                        <CreateSubActivity iconProps={{}} round={round} />
                    </Grid>
                </Grid>
            </Box>
            <Box
                sx={{
                    '& .MuiSpeedDial-root': {
                        display: 'none',
                    },
                }}
            >
                <Table
                    data={subActivities?.results ?? []}
                    count={subActivities?.count ?? 0}
                    pages={subActivities?.pages ?? 1}
                    params={params}
                    columns={columns}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    extraProps={{ loading }}
                    onTableParamsChange={onTableParamsChange}
                />
            </Box>
        </>
    );
};
