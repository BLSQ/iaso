import { Box, Pagination } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Paginated } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { BudgetEventCard } from '../../cards/BudgetEventCard';
import { BudgetStep } from '../../types';

type Props = {
    budgetDetails: Paginated<BudgetStep>;
    page?: number | string;
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
    const safePage = Number.isSafeInteger(page)
        ? (page as number)
        : parseInt(page as string, 10);
    return (
        <Box width="100%">
            {budgetDetails?.results.map((budgetStep, i) => {
                return (
                    <Box mb={1} key={`event-${budgetStep.transition_key}-${i}`}>
                        <BudgetEventCard step={budgetStep} />
                    </Box>
                );
            })}
            {budgetDetails && (
                <Pagination
                    className={classes.pagination}
                    page={safePage}
                    count={budgetDetails?.pages}
                    showLastButton
                    showFirstButton
                    onChange={onCardPaginationChange}
                    hidePrevButton={false}
                    hideNextButton={false}
                    size="small"
                />
            )}
        </Box>
    );
};
