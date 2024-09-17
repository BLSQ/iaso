import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    Table,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';
import {Filters} from './components/Filters';
import { useGroupSetsTableColumns } from './config';
import MESSAGES from './messages';
import { useGetGroupSets, useDeleteGroupSet } from './hooks/requests';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useNavigate } from 'react-router-dom';

import {
    AddButton as AddButtonComponent,
} from 'bluesquare-components';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const baseUrl = baseUrls.groupSets;
const GroupSets = () => {
    const params = useParamsObject(baseUrl);
    const redirectTo = useRedirectTo();
    const classes = useStyles();
    const {mutate: deleteGroupSet, isLoading: isDeleting} = useDeleteGroupSet()
    const tableColumns = useGroupSetsTableColumns(  deleteGroupSet);
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetGroupSets(params);
    const navigate = useNavigate();
    const isLoading = isFetching;
    const createGroupSet =() => {
        // how to use the paths ?
        navigate("/orgunits/groupSet/groupSetId/new")
    }
    return (
        <>
            {isLoading && <LoadingSpinner />}
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
                    <Table
                        data={data?.group_sets ?? []}
                        pages={data?.pages ?? 1}
                        defaultSorted={[{ id: 'name', desc: false }]}
                        columns={tableColumns}
                        count={data?.count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={(_, newParams) =>
                            redirectTo(baseUrl, newParams)
                        }
                        marginTop={false}
                    />
                )}
            </Box>
        </>
    );
};

export default GroupSets;
