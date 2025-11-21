import React, { FunctionComponent } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { commonStyles, getParamsKey } from 'bluesquare-components';
import { FiltersComponent } from '../filters/FiltersComponent';

const MESSAGES = defineMessages({
    search: {
        id: 'iaso.label.textSearch',
        defaultMessage: 'Search',
    },
});

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    column: {
        '&>section': {
            width: '100%',
        },
    },
    icon: {
        //@ts-ignore
        color: theme.palette.ligthGray.border,
        fontWeight: 'light',
        fontSize: 150,
    },
}));

type Props = {
    params: Record<string, any>;
    onSearch: (value: any) => void;
    redirectTo: (url: string, params: Record<string, any>) => void;
    baseUrl?: string;
    filters?: any[];
    defaultFiltersUpdated?: boolean;
    toggleActiveSearch?: boolean;
    extraComponent?: React.ReactNode;
    paramsPrefix?: string;
    filtersColumnsCount?: number;
};

const Filters: FunctionComponent<Props> = ({
    params,
    redirectTo,
    onSearch,
    paramsPrefix = '',
    baseUrl = '',
    filters = [],
    defaultFiltersUpdated = false,
    toggleActiveSearch = false,
    extraComponent = <></>,
    filtersColumnsCount = 3,
}) => {
    const [filtersUpdated, setFiltersUpdated] = React.useState(
        !defaultFiltersUpdated,
    );

    const classes: Record<string, string> = useStyles();
    const handleSearch = () => {
        let tempParams: Record<string, any> | null = null;
        if (filtersUpdated) {
            setFiltersUpdated(false);
            tempParams = {
                ...params,
                page: 1,
                [getParamsKey(paramsPrefix, 'page')]: 1,
            };
            // TS compiler wrongly thinks tempParams can be null at this point
            //@ts-ignore
            if (!tempParams.searchActive && toggleActiveSearch) {
                //@ts-ignore
                tempParams.searchActive = true;
            }
            redirectTo(baseUrl, tempParams);
        }
        onSearch(tempParams);
    };

    return (
        <Grid container spacing={2}>
            {Array(filtersColumnsCount)
                .fill(undefined)
                .map((x, i) => i + 1)
                .map(column => (
                    <Grid
                        container
                        item
                        xs={12}
                        md={3}
                        className={classes.column}
                        key={`column-${column}`}
                    >
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => setFiltersUpdated(true)}
                            filters={filters.filter(f => f.column === column)}
                            onEnterPressed={() => handleSearch()}
                        />
                    </Grid>
                ))}

            <Grid
                item
                container
                justifyContent="flex-end"
                xs={12}
                md={filtersColumnsCount === 3 ? 3 : 12}
            >
                <Box mb={2} mt={filtersColumnsCount === 3 ? 2 : 0} p={0}>
                    {extraComponent}
                    <Button
                        data-test="search-button"
                        disabled={!filtersUpdated}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.search} />
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Filters;
