import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';
import { Filters } from './components/Filters';
import { EntityTypesDialog } from './components/EntityTypesDialog';
import {
    useGetTypesPaginated,
    useDelete,
    useSave,
} from './hooks/requests/entitiyTypes';

import { useColumns, baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../../routing/actions';
import { PaginationParams } from '../../../types/general';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import * as Permission from '../../../utils/permissions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = PaginationParams & {
    search?: string;
};

type Props = {
    params: Params;
};

export const EntityTypes: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } = useGetTypesPaginated(params);
    const { mutate: deleteEntityType, isLoading: deleting } = useDelete();
    const { mutateAsync: saveEntityType, isLoading: saving } = useSave();

    const isLoading = fetchingEntities || deleting || saving;
    const columns = useColumns({ deleteEntityType, saveEntityType });
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    {userHasPermission(
                        Permission.ENTITY_TYPE_WRITE,
                        currentUser,
                    ) && (
                        <EntityTypesDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent
                                    dataTestId="add-entity-button"
                                    onClick={openDialog}
                                />
                            )}
                            saveEntityType={saveEntityType}
                        />
                    )}
                </Grid>
                <Table
                    data={data?.types ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
