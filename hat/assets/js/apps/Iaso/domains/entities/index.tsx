import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    Table,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSafeIntl,
    // AddButton as AddButtonComponent,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import { Filters } from './components/Filters';
// import { EntityDialog } from './components/EntityDialog';
import { useGetPaginated, useDelete, useSave } from './hooks/requests/entities';

import { columns, baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    entityTypes?: string;
};

type Props = {
    params: Params;
};

export const Entities: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } = useGetPaginated(params);
    const { mutate: deleteEntity, isLoading: deleting } = useDelete();
    const { mutate: saveEntity, isLoading: saving } = useSave();

    const isLoading = fetchingEntities || deleting || saving;

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
                    {/* Uncomment when adding entities is implemented */}
                    {/* <EntityDialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent dataTestId="add-entity-button" onClick={openDialog} />
                        )}
                        saveEntity={saveEntity}
                    /> */}
                </Grid>
                <Table
                    data={data?.entities ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns({
                        formatMessage,
                        deleteEntity,
                        saveEntity,
                    })}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
