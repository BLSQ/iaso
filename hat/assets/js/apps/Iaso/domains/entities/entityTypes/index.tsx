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
    // @ts-ignore
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

import { columns, baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};

type Props = {
    params: Params;
};

export const EntityTypes: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } = useGetTypesPaginated(params);
    const { mutate: deleteEntityType, isLoading: deleting } = useDelete();
    const { mutate: saveEntityType, isLoading: saving } = useSave();

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
                </Grid>
                <Table
                    data={data?.types ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns({
                        formatMessage,
                        deleteEntityType,
                        saveEntityType,
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
