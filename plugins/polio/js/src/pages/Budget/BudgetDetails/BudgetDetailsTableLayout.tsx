import { Box, Divider, Grid, Paper } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { GraphTitle } from '../../../components/LQAS-IM/GraphTitle';
import { LinkToProcedure } from './LinkToProcedure';
import MESSAGES from '../../../constants/messages';
import { BUDGET_DETAILS } from '../../../constants/routes';
import {
    Column,
    Paginated,
} from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BudgetStep } from '../types';

type Props = {
    budgetDetails?: Paginated<BudgetStep>;
    resetPageToOne: any;
    isFetching: boolean;
    columns: Column[];
    params: any;
};

export const BudgetDetailsTableLayout: FunctionComponent<Props> = ({
    budgetDetails,
    params,
    columns,
    isFetching,
    resetPageToOne,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Paper elevation={2}>
                <Box
                    ml={2}
                    pt={2}
                    mr={2}
                    pb={budgetDetails?.results.length === 0 ? 1 : 0}
                >
                    <Grid container justifyContent="space-between">
                        <Grid item lg={8}>
                            <GraphTitle
                                text={formatMessage(MESSAGES.steps)}
                                displayTrigger
                            />
                        </Grid>
                        <Grid container item xs={4} justifyContent="flex-end">
                            <LinkToProcedure />
                        </Grid>
                    </Grid>
                    <Box mt={2} mb={1}>
                        <Divider />
                    </Box>
                    <TableWithDeepLink
                        data={budgetDetails?.results ?? []}
                        count={budgetDetails?.count}
                        pages={budgetDetails?.pages}
                        params={params}
                        columns={columns}
                        baseUrl={BUDGET_DETAILS}
                        marginTop={false}
                        extraProps={{
                            loading: isFetching,
                            columns,
                        }}
                        resetPageToOne={resetPageToOne}
                        elevation={0}
                    />
                </Box>
            </Paper>
        </>
    );
};
