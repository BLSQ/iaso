import { Grid, Box } from '@material-ui/core';
import React, { FunctionComponent, useState } from 'react';

// import InputComponent from '../../../components/forms/InputComponent';
import { ColorPicker } from '../../../components/forms/ColorPicker';
import { SearchFilter } from '../../../components/filters/Search';

import { getChipColors } from '../../../constants/chipColors';

// import MESSAGES from '../messages';

type Props = {
    searches: [Record<string, unknown>];
    searchIndex: number;
    // eslint-disable-next-line no-unused-vars
    setTextSearchError: (hasError: boolean) => void;
    onSearch: () => void;
    // eslint-disable-next-line no-unused-vars
    onChangeColor: (color: string, index: number) => void;
    // eslint-disable-next-line no-unused-vars
    setFiltersUpdated: (isUpdated: boolean) => void;
    setSearches: React.Dispatch<
        React.SetStateAction<[Record<string, unknown>]>
    >;
};

export const OrgUnitFilters: FunctionComponent<Props> = ({
    searches,
    searchIndex,
    onSearch,
    onChangeColor,
    setTextSearchError,
    setFiltersUpdated,
    setSearches,
}) => {
    const [filters, setFilters] = useState(searches[searchIndex]);
    const handleChange = (key, value) => {
        setFiltersUpdated(true);
        const newFilters: Record<string, unknown> = {
            ...filters,
            [key]: value,
        };
        if (newFilters.source && newFilters.version) {
            delete newFilters.source;
        }
        setFilters(newFilters);
        const tempSearches: [Record<string, unknown>] = [...searches];
        tempSearches[searchIndex] = newFilters;
        setSearches(tempSearches);
    };
    const currentColor = filters.color
        ? `#${filters.color}`
        : getChipColors(searchIndex);
    return (
        <Grid container spacing={0}>
            <Grid item xs={3}>
                <Box mt={3} mb={4}>
                    <ColorPicker
                        currentColor={currentColor}
                        onChangeColor={color =>
                            onChangeColor(color, searchIndex)
                        }
                    />
                </Box>
                <SearchFilter
                    withMarginTop
                    uid={`search-${searchIndex}`}
                    onEnterPressed={() => onSearch()}
                    onChange={handleChange}
                    keyValue="search"
                    required
                    value={filters.search ? `${filters.search}` : ''}
                    onErrorChange={setTextSearchError}
                />
                {/* <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                /> */}
            </Grid>
        </Grid>
    );
};
