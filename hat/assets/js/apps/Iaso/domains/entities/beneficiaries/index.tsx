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
    // AddButton as AddButtonComponent,
} from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';
import { Filters } from './components/Filters';
// import { Dialog } from './components/Dialog';
import {
    useGetBeneficiariesPaginated,
    useDeleteBeneficiary,
    // useSaveBeneficiary,
} from './hooks/requests';

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
    entityTypes?: string;
};

type Props = {
    params: Params;
};

export const Beneficiaries: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingEntities } =
        useGetBeneficiariesPaginated(params);
    const { mutate: deleteEntity, isLoading: deleting } =
        useDeleteBeneficiary();
    // const { mutate: saveEntity, isLoading: saving } = useSaveBeneficiary();

    // const isLoading = fetchingEntities || deleting || saving;
    const isLoading = fetchingEntities || deleting;

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.beneficiaries)}
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
                            <AddButtonComponent
                                dataTestId="add-beneficiary-button"
                                onClick={openDialog}
                            />
                        )}
                        saveEntity={saveEntity}
                    /> */}
                </Grid>
                <Table
                    data={data?.beneficiary ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns({
                        formatMessage,
                        deleteEntity,
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
