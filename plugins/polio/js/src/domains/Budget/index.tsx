import SearchIcon from '@mui/icons-material/Search';
import { Pagination } from '@mui/lab';
import { Box, Collapse, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    useSafeIntl,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';

// @ts-ignore
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import { userHasPermission } from '../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { handleTableDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/utils/table';
import MESSAGES from '../../constants/messages';
import { BUDGET } from '../../constants/routes';
import { useStyles } from '../../styles/theme';
import { BudgetButtons } from './BudgetButtons';
import { BudgetFilters } from './BudgetFilters';
import { BudgetCard } from './cards/BudgetCard';
import {
    useBudgetParams,
    useGetBudgets,
    useGetWorkflowStatesForDropdown,
} from './hooks/api/useGetBudget';
import { useBudgetColumns } from './hooks/config';
import { Budget } from './types';

type Props = {
    router: any;
};

const getCsvParams = (apiParams: Record<string, any>): string => {
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pageSize,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        page,
        ...paramsForCsv
    } = apiParams;
    const filteredParams: Record<string, any> = Object.fromEntries(
        Object.entries(paramsForCsv).filter(
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            ([_key, value]) => value !== undefined,
        ),
    );
    return new URLSearchParams(filteredParams).toString();
};

const usePaginationStyles = makeStyles({
    pagination: {
        '&.MuiPagination-root > .MuiPagination-ul': {
            justifyContent: 'center',
        },
    },
    alignRight: { textAlign: 'right' },
});

export const BudgetProcessList: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const paginationStyle = usePaginationStyles();
    const classes = useStyles();
    const [expand, setExpand] = useState<boolean>(false);

    const apiParams = useBudgetParams(params);
    const csvParams = getCsvParams(apiParams);

    const currentUser = useCurrentUser();
    const isUserPolioBudgetAdmin = userHasPermission(
        'iaso_polio_budget_admin',
        currentUser,
    );

    const { data: budgets, isFetching } = useGetBudgets(apiParams);
    const columns = useBudgetColumns(isUserPolioBudgetAdmin);
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    useSkipEffectOnMount(() => {
        const newParams = {
            ...apiParams,
        };
        delete newParams.page;
        delete newParams.order;
    }, [apiParams.pageSize, apiParams.search]);

    const onCardPaginationChange = useCallback(
        (_value, newPage) => {
            handleTableDeepLink(BUDGET)({ ...apiParams, page: newPage });
        },
        [apiParams],
    );
    const { data: possibleStates } = useGetWorkflowStatesForDropdown();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budget)}
                displayBackButton={false}
            >
                {isMobileLayout && (
                    <Box
                        position="absolute"
                        top={theme.spacing(2)}
                        right={theme.spacing(2)}
                    >
                        <SearchIcon
                            onClick={() => {
                                setExpand(value => !value);
                            }}
                        />
                    </Box>
                )}
            </TopBar>
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isMobileLayout && (
                    <Collapse in={expand}>
                        <BudgetFilters
                            params={params}
                            buttonSize="small"
                            statesList={possibleStates}
                        />
                        <Box mb={2}>
                            <BudgetButtons
                                csvUrl={`/api/polio/budget/export_csv/?${csvParams}`}
                                isUserPolioBudgetAdmin={isUserPolioBudgetAdmin}
                                isMobileLayout
                            />
                        </Box>
                    </Collapse>
                )}

                {!isMobileLayout && (
                    <>
                        <BudgetFilters
                            params={params}
                            statesList={possibleStates}
                        />
                        <BudgetButtons
                            csvUrl={`/api/polio/budget/export_csv/?${csvParams}`}
                            isUserPolioBudgetAdmin={isUserPolioBudgetAdmin}
                        />
                        {/* @ts-ignore */}
                        <TableWithDeepLink
                            data={budgets?.results ?? []}
                            count={budgets?.count}
                            pages={budgets?.pages}
                            params={apiParams}
                            columns={columns}
                            baseUrl={BUDGET}
                            marginTop={false}
                            extraProps={{
                                loading: isFetching,
                                apiParams,
                            }}
                        />
                    </>
                )}
                {isMobileLayout && (
                    <>
                        {isFetching && <LoadingSpinner />}
                        {budgets?.results &&
                            budgets.results.map((budget: Budget) => (
                                <Box key={budget.id} mb={1}>
                                    <BudgetCard budget={budget} />
                                </Box>
                            ))}

                        {budgets && (
                            <Pagination
                                className={paginationStyle.pagination}
                                page={budgets.page}
                                count={budgets.pages}
                                showLastButton
                                showFirstButton
                                onChange={onCardPaginationChange}
                                hidePrevButton={false}
                                hideNextButton={false}
                                size="small"
                            />
                        )}
                    </>
                )}
            </Box>
        </>
    );
};
