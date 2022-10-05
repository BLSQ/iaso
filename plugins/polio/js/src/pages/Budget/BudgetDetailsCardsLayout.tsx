import { Box, makeStyles } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import React, { FunctionComponent } from 'react';
import { PaginatedBudgetDetails } from '../../hooks/useGetBudgetDetails';
import { BudgetEventCard } from './cards/BudgetEventCard';

type Props = {
    budgetDetails: PaginatedBudgetDetails;
    page?: number | string;
    // eslint-disable-next-line no-unused-vars
    onCardPaginationChange: (value: any, newPage: number) => void;
};

const useStyles = makeStyles({
    pagination: {
        '&.MuiPagination-root > .MuiPagination-ul': {
            justifyContent: 'center',
        },
    },
});

export const BudgetDetailsCardsLayout: FunctionComponent<Props> = ({
    budgetDetails,
    page,
    onCardPaginationChange,
}) => {
    const classes = useStyles();
    return (
        <>
            {budgetDetails?.results.map(budgetStep => {
                return (
                    <Box mb={1} key={`event-${budgetStep.transition_key}`}>
                        <BudgetEventCard event={budgetStep} />
                    </Box>
                );
            })}
            {budgetDetails && (
                <Pagination
                    className={classes.pagination}
                    page={
                        Number.isSafeInteger(page)
                            ? (page as number)
                            : parseInt(page as string, 10)
                    }
                    count={budgetDetails?.pages}
                    showLastButton
                    showFirstButton
                    onChange={onCardPaginationChange}
                    hidePrevButton={false}
                    hideNextButton={false}
                    size="small"
                />
            )}
        </>
    );
};
