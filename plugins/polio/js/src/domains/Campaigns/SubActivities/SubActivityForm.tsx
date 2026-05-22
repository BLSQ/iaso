import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { Table } from 'bluesquare-components';
import { useTableState } from '../../../../../../../hat/assets/js/apps/Iaso/utils/table';
import { Round } from '../../../constants/types';
import { SubActivitiesInfos } from './components/SubActivitiesInfos';
import { useGetSubActivities } from './hooks/api/useGetSubActivities';
import { useSubActivitiesColumns } from './hooks/useSubActivitiesColumns';

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
            <Box mb={-6}>
                <SubActivitiesInfos round={round} />
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
