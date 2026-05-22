import React from 'react';
import { Box, Stack, PaginationItem } from '@mui/material';
import { PageRowSelect } from 'bluesquare-components';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 30, 40, 50];

type CursorPaginationProps = {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
    pageSize: number;
    onPageSizeChange: (newPageSize: number) => void;
    pageSizeOptions?: number[];
};

export const CursorPagination: React.FC<CursorPaginationProps> = ({
    hasNext,
    hasPrev,
    onNext,
    onPrev,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = ROWS_PER_PAGE_OPTIONS,
}) => {
    return (
        <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            px={2}
        >
            <Box
                sx={{
                    //  Reset `mr={8}` on PageRowSelect
                    '& > div': {
                        marginRight: '0 !important',
                    },
                }}
                mr={4}
            >
                <PageRowSelect
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={pageSizeOptions}
                    selectRowsPerPage={onPageSizeChange}
                />
            </Box>

            <Stack direction="row" spacing={1}>
                <PaginationItem
                    type="previous"
                    variant="outlined"
                    shape="rounded"
                    disabled={!hasPrev}
                    onClick={onPrev}
                    size="large"
                />
                <PaginationItem
                    type="next"
                    variant="outlined"
                    shape="rounded"
                    disabled={!hasNext}
                    onClick={onNext}
                    size="large"
                />
            </Stack>
        </Box>
    );
};
