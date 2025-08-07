import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { PaginationParams } from '../../../types/general';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { AddEntityTypesDialog } from './components/EntityTypesDialog';
import { Filters } from './components/Filters';
import { useColumns, baseUrl } from './config';
import {
    useGetTypesPaginated,
    useDelete,
    useSave,
} from './hooks/requests/entitiyTypes';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = PaginationParams & {
    search?: string;
};

export const EntityTypes: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entityTypes) as Params;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const redirectTo = useRedirectTo();

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
                        <AddEntityTypesDialog
                            iconProps={{
                                dataTestId: 'add-entity-button',
                            }}
                            titleMessage={MESSAGES.create}
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
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
