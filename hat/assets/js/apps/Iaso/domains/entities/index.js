import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import Dialog from './components/Dialog';

import { useGet } from './hooks/useGet';
import { useDelete } from './hooks/useDelete';
import { useSave } from './hooks/useSave';

import { columns, baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Entities = ({ params }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } = useGet(params);
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
                    <Dialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <div id="add-button-container">
                                <AddButtonComponent onClick={openDialog} />
                            </div>
                        )}
                        params={params}
                        saveEntity={saveEntity}
                    />
                </Grid>
                <Table
                    data={data?.entities ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns({
                        params,
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

Entities.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Entities;
