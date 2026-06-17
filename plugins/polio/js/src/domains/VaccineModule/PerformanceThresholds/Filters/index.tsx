import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SearchButton } from 'Iaso/components/SearchButton';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { baseUrls } from '../../../../../src/constants/urls';
import MESSAGES from '../messages';

type Props = { params: Record<string, string> };

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.performanceThresholds, params });
    return (
        <>
            <Grid container spacing={2}>
                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                        lg: 4,
                    }}
                >
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
                <Grid
                    container
                    size={{
                        xs: 12,
                        md: 6,
                        lg: 8,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'end',
                            flexDirection: 'column',
                            width: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                mt: 2,
                            }}
                        >
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
