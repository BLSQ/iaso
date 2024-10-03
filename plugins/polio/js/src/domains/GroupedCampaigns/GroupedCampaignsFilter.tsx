import FiltersIcon from '@mui/icons-material/FilterList';
import { Box, Button, Grid } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import { PaginationParams } from '../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../constants/messages';
import { baseUrls } from '../../constants/urls';

type Params = PaginationParams & {
    search?: string;
    showOnlyDeleted?: string;
};

type Props = {
    params: Params;
    disableOnlyDeleted?: boolean;
};

const baseUrl = baseUrls.groupedCampaigns;

export const GroupedCampaignsFilter: FunctionComponent<Props> = ({
    params,
    // TODO set to false when showOnlyDeleted is implemented
    disableOnlyDeleted = true,
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl,
            params,
            saveSearchInHistory: false,
        });
    const [textSearchError, setTextSearchError] = useState(false);

    // const { data, isFetching: isFetchingCountries } = useGetCountries();
    // const countriesList = data?.orgUnits ?? [];

    return (
        <>
            <Box display="inline-flex" width="85%">
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <InputComponent
                            keyValue="search"
                            onChange={handleChange}
                            value={filters.search}
                            type="search"
                            label={MESSAGES.search}
                            onEnterPressed={handleSearch}
                            blockForbiddenChars
                            onErrorChange={setTextSearchError}
                        />
                        {!disableOnlyDeleted && (
                            <InputComponent
                                keyValue="showOnlyDeleted"
                                onChange={handleChange}
                                value={filters.showOnlyDeleted}
                                type="checkbox"
                                label={MESSAGES.showOnlyDeleted}
                            />
                        )}
                    </Grid>
                    {/* TODO uncomment when filter ready in backend */}
                    {/* <Grid item xs={3}>
                        <InputComponent
                            loading={isFetchingCountries}
                            keyValue="countries"
                            multi
                            clearable
                            onChange={(key, value) => {
                                setCountries(value);
                            }}
                            value={countries}
                            type="select"
                            options={countriesList.map(c => ({
                                label: c.name,
                                value: c.id,
                            }))}
                            label={MESSAGES.country}
                        />
                    </Grid> */}
                </Grid>
            </Box>
            <Box display="inline-flex" width="15%" justifyContent="flex-end">
                <Box position="relative" top={16}>
                    <Button
                        disabled={textSearchError || !filtersUpdated}
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                    >
                        <Box mr={1} top={3} position="relative">
                            <FiltersIcon />
                        </Box>
                        <FormattedMessage {...MESSAGES.filter} />
                    </Button>
                </Box>
            </Box>
        </>
    );
};
