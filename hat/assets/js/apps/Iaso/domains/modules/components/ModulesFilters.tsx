import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import { ApiModulesListParams } from 'Iaso/api/modules';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';

type Props = {
    params?: ApiModulesListParams;
};

const baseUrl = baseUrls.modules;
export const ModulesFilters = ({ params }: Props) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl,
            params: params,
            withPagination: false,
        });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    return (
        <Grid container spacing={8} sx={{
            justifyContent: "flex-end"
        }}>
            <Grid
                size={{
                    xs: 12,
                    sm: 6,
                    md: 3
                }}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                />
            </Grid>
            <Grid
                size={{
                    xs: 12,
                    sm: 6,
                    md: 9
                }}>
                <Box
                    sx={{
                        mt: 2,
                        mb: 2
                    }}>
                    <SearchButton
                        disabled={textSearchError || !filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
