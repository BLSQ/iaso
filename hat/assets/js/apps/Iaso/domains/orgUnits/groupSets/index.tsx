import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddButton as AddButtonComponent,
    commonStyles,
    useSafeIntl
} from 'bluesquare-components';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { Filters } from './components/Filters';
import { useGroupSetsTableColumns } from './config';
import { useDeleteGroupSet, useGetGroupSets } from './hooks/requests';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const baseUrl = baseUrls.groupSets;
const GroupSets = () => {
    const params = useParamsObject(baseUrl);
    const classes = useStyles();
    const { mutate: deleteGroupSet } = useDeleteGroupSet();
    const tableColumns = useGroupSetsTableColumns(deleteGroupSet);
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetGroupSets(params);
    const navigate = useNavigate();
    const isLoading = isFetching;
    const createGroupSet = () => {
        navigate(`/${baseUrls.groupSetDetail}/groupSetId/new`);
    };
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.groupSets)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />

                <Box mt={4}>
                    <Grid container spacing={2} justifyContent="flex-end">
                        <AddButtonComponent
                            onClick={createGroupSet}
                            dataTestId="create-groupset"
                        />
                    </Grid>
                </Box>

                {tableColumns && (
                    <TableWithDeepLink
                        data={data?.group_sets ?? []}
                        pages={data?.pages ?? 1}
                        defaultSorted={[{ id: 'name', desc: false }]}
                        columns={tableColumns}
                        count={data?.count ?? 0}
                        baseUrl={baseUrl}
                        marginTop={false}
                        extraProps={{
                            loading: isLoading,
                        }}
                        params={params}
                    />
                )}
            </Box>
        </>
    );
};

export default GroupSets;
