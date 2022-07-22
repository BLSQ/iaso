import { Box, makeStyles, Button } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import { useDispatch } from 'react-redux';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useCallback,
    // useEffect,
} from 'react';
import classnames from 'classnames';

import { FilterButton } from '../../../components/FilterButton';
import { OrgUnitFilters as Filters } from './OrgUnitsFilters';
import { redirectTo } from '../../../routing/actions';

import { OrgUnitParams } from '../types/orgUnit';

import { baseUrls } from '../../../constants/urls';

import { IntlFormatMessage } from '../../../types/intl';
import { Search } from '../types/search';
import { DropdownOptions } from '../../../types/utils';

import MESSAGES from '../messages';

type Props = {
    params: OrgUnitParams;
    searches: [Search];
    setSearches: React.Dispatch<React.SetStateAction<[Search]>>;
    // eslint-disable-next-line no-unused-vars
    onSearch: (searches: any) => void;
    currentTab: string;
    filtersUpdated: boolean;
    setFiltersUpdated: React.Dispatch<React.SetStateAction<boolean>>;
    orgunitTypes: DropdownOptions<string>[];
    isFetchingOrgunitTypes: boolean;
};

const baseUrl = baseUrls.orgUnits;
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
    searches,
    setSearches,
    orgunitTypes,
    isFetchingOrgunitTypes,
}) => {
    const dispatch = useDispatch();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

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
            onSearch(tempParams);
        }
    }, [filtersUpdated, params, searches, onSearch]);

    const handleChangeColor = useCallback(
        (color: string, searchIndex: number) => {
            const newSearches = [...searches];
            newSearches[searchIndex].color = color.replace('#', '');
            const tempParams = {
                ...params,
                searches: JSON.stringify(newSearches),
            };
            dispatch(redirectTo(baseUrl, tempParams));
        },
        [searches, params, dispatch],
    );

    return (
        <>
            <Filters
                onSearch={handleSearch}
                searchIndex={currentSearchIndex}
                currentSearch={searches[currentSearchIndex]}
                searches={searches}
                setTextSearchError={setTextSearchError}
                setFiltersUpdated={setFiltersUpdated}
                setSearches={setSearches}
                onChangeColor={handleChangeColor}
                currentTab={currentTab}
                params={params}
                setHasLocationLimitError={setHasLocationLimitError}
                filtersUpdated={filtersUpdated}
                orgunitTypes={orgunitTypes}
                isFetchingOrgunitTypes={isFetchingOrgunitTypes}
            />
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
