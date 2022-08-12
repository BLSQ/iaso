import React, {
    useState,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
import { useDispatch } from 'react-redux';

import { Grid, Button, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';

import { containsForbiddenCharacter } from '../../../constants/filters';

import { baseUrl } from '../config';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    entityTypes?: string;
};

type Props = {
    params: Params;
    // eslint-disable-next-line no-unused-vars
    onErrorChange: (hasError: boolean) => void;
    isSearchDisabled: boolean;
};

const Filters: FunctionComponent<Props> = ({
    params,
    onErrorChange,
    isSearchDisabled,
}) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [textSearchErrors, setTextSearchErrors] = useState<Array<string>>([]);
    const [hasError, setHasError] = useState<boolean>(false);
    const [filters, setFilters] = useState({
        search: params.search,
    });

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, dispatch, filters, params]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    useEffect(() => {
        if (filters.search !== undefined) {
            const hasForbiddenChar = containsForbiddenCharacter(filters.search);
            setHasError(hasForbiddenChar);
            const newErrors = hasForbiddenChar
                ? [formatMessage(MESSAGES.forbiddenChars)]
                : [];
            setTextSearchErrors(newErrors);
        }
    }, [filters.search, formatMessage]);

    useEffect(() => {
        onErrorChange(hasError);
    }, [hasError, onErrorChange]);

    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        errors={textSearchErrors}
                    />
                </Grid>
            </Grid>
            <Grid
                container
                spacing={4}
                justifyContent="flex-end"
                alignItems="center"
            >
                <Grid
                    item
                    xs={2}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Button
                        data-test="search-button"
                        disabled={!filtersUpdated || isSearchDisabled}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.search)}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export { Filters };
