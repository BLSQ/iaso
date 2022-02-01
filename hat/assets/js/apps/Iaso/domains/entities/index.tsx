import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    // AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
// import Dialog from './components/Dialog';

import { useGetPaginated } from './hooks/useGet';
import { useDelete } from './hooks/useDelete';
import { useSave } from './hooks/useSave';

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

const Entities: FunctionComponent<Props> = ({ params }) => {
    const classes: any = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } = useGetPaginated(params);
    const { mutate: deleteEntitiy, isLoading: deleting } = useDelete();
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
                    {/* <Dialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <div id="add-button-container">
                                <AddButtonComponent onClick={openDialog} />
                            </div>
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
                        deleteEntitiy,
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
export default Entities;
