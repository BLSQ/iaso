import React, { FunctionComponent, useState, useCallback } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import {
    Box,
    useMediaQuery,
    useTheme,
    Collapse,
    makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { Pagination } from '@material-ui/lab';

// @ts-ignore
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { useStyles } from '../../styles/theme';
import { BUDGET } from '../../constants/routes';
import MESSAGES from '../../constants/messages';
import { useBudgetColumns } from './hooks/config';

import { convertObjectToString } from '../../utils';

import { BudgetFilters } from './BudgetFilters';
import { BudgetCard } from './cards/BudgetCard';

import {
    Budget,
    useBudgetParams,
    useGetBudgets,
} from './hooks/api/useGetBudget';

import { handleTableDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/utils/table';

type Props = {
    router: any;
};
const style = () => {
    return {
        pagination: {
            '&.MuiPagination-root > .MuiPagination-ul': {
                justifyContent: 'center',
            },
        },
    };
};

const usePaginationStyles = makeStyles(style);

export const BudgetList: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const paginationStyle = usePaginationStyles();
    const classes = useStyles();
    const [resetPageToOne, setResetPageToOne] = useState<string>('');
    const [expand, setExpand] = useState<boolean>(false);

    const apiParams = useBudgetParams(params);

    // const { data: campaigns, isFetching: isFetchingCampaigns } =
    //     useGetCampaigns(apiParams).query;
    const { data: budgets, isFetching } = useGetBudgets(apiParams);
    const columns = useBudgetColumns();
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    useSkipEffectOnMount(() => {
        const newParams = {
            ...apiParams,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [apiParams.pageSize, apiParams.search]);

    const onCardPaginationChange = useCallback(
        (_value, newPage) => {
            handleTableDeepLink(BUDGET)({ ...apiParams, page: newPage });
        },
        [apiParams],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budget)}
                displayBackButton={false}
            >
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
            </TopBar>
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isMobileLayout && (
                    <Collapse in={expand}>
                        <BudgetFilters params={params} buttonSize="small" />
                    </Collapse>
                )}

                {!isMobileLayout && (
                    <>
                        <BudgetFilters params={params} />

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
                            }}
                            resetPageToOne={resetPageToOne}
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
