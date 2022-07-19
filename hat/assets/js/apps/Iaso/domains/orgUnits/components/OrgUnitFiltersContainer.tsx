import { Box, makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useCallback,
    useEffect,
} from 'react';
import classnames from 'classnames';

import { FilterButton } from '../../../components/FilterButton';
import { OrgUnitFilters as Filters } from './OrgUnitsFilters';

import { OrgUnitParams } from '../types/orgUnit';

// import MESSAGES from '../messages';
// import { baseUrls } from '../../../constants/urls';

import { decodeSearch } from '../utils';

type Props = {
    params: OrgUnitParams;
    // eslint-disable-next-line no-unused-vars
    onSearch: (searches: any) => void;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: '-100',
        opacity: '0',
    },
}));

// const baseUrl = baseUrls.teams;

export const OrgUnitFiltersContainer: FunctionComponent<Props> = ({
    params,
    onSearch,
}) => {
    const classes: Record<string, string> = useStyles();
    // @ts-ignore
    const searchParams: [Record<string, unknown>] = decodeSearch(
        decodeURI(params.searches),
    );
    const [searches, setSearches] = useState<[Record<string, unknown>]>([
        ...searchParams,
    ]);

    const [textSearchError, setTextSearchError] = useState(false);
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const currentSearchIndex = parseInt(params.searchTabIndex, 10);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            const tempParams = {
                ...params,
                page: 1,
                searches: JSON.stringify(searches),
            };

            onSearch(tempParams);
            setFiltersUpdated(false);
        }
    }, [filtersUpdated, searches, params, onSearch]);

    const handleChangeColor = useCallback(
        (color: string, searchIndex: number) => {
            const newSearches = [...searches];
            newSearches[searchIndex].color = color.replace('#', '');
            const tempParams = {
                ...params,
                page: 1,
                searches: JSON.stringify(newSearches),
            };

            onSearch(tempParams);
        },
        [searches, params, onSearch],
    );

    useEffect(() => {
        setSearches(searchParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.length]);

    return (
        <>
            {searches.map((_, searchIndex) => {
                return (
                    <Box
                        key={searchIndex}
                        className={classnames(
                            searchIndex !== currentSearchIndex &&
                                classes.hiddenOpacity,
                        )}
                    >
                        FILTERS {searchIndex}
                        <Filters
                            onSearch={handleSearch}
                            searchIndex={searchIndex}
                            searches={searches}
                            setTextSearchError={setTextSearchError}
                            setFiltersUpdated={setFiltersUpdated}
                            setSearches={setSearches}
                            onChangeColor={handleChangeColor}
                        />
                    </Box>
                );
            })}
            <Box mt={2} mr={-2}>
                <FilterButton
                    disabled={!filtersUpdated || textSearchError}
                    onFilter={handleSearch}
                />
            </Box>
        </>
    );
};
