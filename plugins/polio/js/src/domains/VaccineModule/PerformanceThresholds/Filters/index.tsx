import { useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../../src/constants/urls';
import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../messages';
import { SearchButton } from 'Iaso/components/SearchButton';
import { useFilterState } from 'Iaso/hooks/useFilterState';

type Props = { params: Record<string, string> };

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.performanceThresholds, params });
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} lg={4}>
                    <InputComponent
                        type="search"
                        clearable
                        keyValue="search"
                        value={filters.search}
                        onChange={handleChange}
                        loading={false}
                        labelString={formatMessage(MESSAGES.search)}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid container item xs={12} md={6} lg={8}>
                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        alignItems="end"
                        flexDirection="column"
                        width="100%"
                    >
                        <Box mt={2}>
                            <SearchButton
                                disabled={!filtersUpdated}
                                onSearch={handleSearch}
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
