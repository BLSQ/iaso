import { Box, Divider, Grid, Paper } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { useSafeIntl, Column, Paginated } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { BudgetDetailsFilters } from './BudgetDetailsFilters';

import { LinkToProcedure } from './LinkToProcedure';
import MESSAGES from '../../../constants/messages';
import { BUDGET_DETAILS } from '../../../constants/routes';

import { BudgetStep } from '../types';

import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { GraphTitle } from '../../LQAS-IM/shared/GraphTitle';

type Props = {
    budgetDetails?: Paginated<BudgetStep>;
    resetPageToOne: any;
    isFetching: boolean;
    columns: Column[];
    params: any;
    showHidden: boolean;
    // eslint-disable-next-line no-unused-vars
    setShowHidden: (show: boolean) => void;
    stepsList?: DropdownOptions<string>[];
};

export const BudgetDetailsTableLayout: FunctionComponent<Props> = ({
    budgetDetails,
    params,
    columns,
    isFetching,
    resetPageToOne,
    stepsList = [],
    showHidden,
    setShowHidden,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Paper elevation={2}>
                <Box pt={2} pb={budgetDetails?.results.length === 0 ? 1 : 0}>
                    <Box px={2}>
                        <Grid container justifyContent="space-between">
                            <Grid item lg={8}>
                                <GraphTitle
                                    text={formatMessage(MESSAGES.steps)}
                                    displayTrigger
                                />
                            </Grid>
                            <Grid
                                container
                                item
                                xs={4}
                                justifyContent="flex-end"
                            >
                                {/* Link causes crash. The current address requires authtication which users don't have anyway */}
                                {/* <LinkToProcedure /> */}
                            </Grid>
                        </Grid>
                    </Box>
                    <Box mt={2} mb={1}>
                        <Divider />
                    </Box>
                    <Box px={2} pb={2}>
                        <BudgetDetailsFilters
                            params={params}
                            stepsList={stepsList}
                            showHidden={showHidden}
                            setShowHidden={setShowHidden}
                        />
                    </Box>
                    <Divider />
                    <TableWithDeepLink
                        countOnTop={false}
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
