import { Box, makeStyles, Button } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import { useDispatch } from 'react-redux';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useCallback,
    useEffect,
} from 'react';
import classnames from 'classnames';

import { FilterButton } from '../../../components/FilterButton';
import { OrgUnitFilters as Filters } from './OrgUnitsFilters';
import { redirectTo } from '../../../routing/actions';

import { OrgUnitParams } from '../types/orgUnit';

import { baseUrls } from '../../../constants/urls';

import { decodeSearch } from '../utils';

import { IntlFormatMessage } from '../../../types/intl';

import MESSAGES from '../messages';

type Props = {
    params: OrgUnitParams;
    // eslint-disable-next-line no-unused-vars
    onSearch: (searches: any) => void;
    currentTab: string;
    filtersUpdated: boolean;
    setFiltersUpdated: React.Dispatch<React.SetStateAction<boolean>>;
    // triggerSearch: boolean;
    setTriggerSearch: React.Dispatch<React.SetStateAction<boolean>>;
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

export const OrgUnitFiltersContainer: FunctionComponent<Props> = ({
    params,
    onSearch,
    currentTab,
    filtersUpdated,
    setFiltersUpdated,
    // triggerSearch,
    setTriggerSearch,
}) => {
    const dispatch = useDispatch();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();
    // @ts-ignore
    const searchParams: [Record<string, unknown>] = decodeSearch(
        decodeURI(params.searches),
    );
    const [searches, setSearches] = useState<[Record<string, unknown>]>([
        ...searchParams,
    ]);

    const [hasLocationLimitError, setHasLocationLimitError] =
        useState<boolean>(false);
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const currentSearchIndex = parseInt(params.searchTabIndex, 10);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            const tempParams = {
                ...params,
                page: 1,
                searches: JSON.stringify(searches),
            };
            setTriggerSearch(true);
            onSearch(tempParams);
        }
    }, [filtersUpdated, params, searches, onSearch, setTriggerSearch]);

    const handleChangeColor = useCallback(
        (color: string, searchIndex: number) => {
            const newSearches = [...searches];
            newSearches[searchIndex].color = color.replace('#', '');
            const tempParams = {
                ...params,
                searches: JSON.stringify(newSearches),
            };
            onSearch(tempParams);
        },
        [searches, params, onSearch],
    );

    const handleLocationLimitChange = useCallback(
        (locationLimit: number) => {
            setFiltersUpdated(true);
            const tempParams = {
                ...params,
                locationLimit,
            };
            setTriggerSearch(true);
            onSearch(tempParams);
        },
        [params, onSearch, setFiltersUpdated, setTriggerSearch],
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
                        <Filters
                            onSearch={handleSearch}
                            searchIndex={searchIndex}
                            searches={searches}
                            setTextSearchError={setTextSearchError}
                            setFiltersUpdated={setFiltersUpdated}
                            setSearches={setSearches}
                            onChangeColor={handleChangeColor}
                            currentTab={currentTab}
                            params={params}
                            setHasLocationLimitError={setHasLocationLimitError}
                            handleLocationLimitChange={
                                handleLocationLimitChange
                            }
                            filtersUpdated={filtersUpdated}
                        />
                    </Box>
                );
            })}
            <Box mt={2} justifyContent="flex-end" display="flex">
                <Button
                    variant="contained"
                    className={classnames(classes.button, classes.marginRight)}
                    color="primary"
                    onClick={() =>
                        dispatch(
                            redirectTo(baseUrls.orgUnitDetails, {
                                orgUnitId: '0',
                            }),
                        )
                    }
                >
                    <Add className={classes.buttonIcon} />
                    {formatMessage(MESSAGES.create)}
                </Button>
                <FilterButton
                    disabled={
                        !filtersUpdated ||
                        textSearchError ||
                        hasLocationLimitError
                    }
                    onFilter={handleSearch}
                />
            </Box>
        </>
    );
};
