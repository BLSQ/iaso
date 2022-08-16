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
    showDeleted?: string;
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
    const [search, setSearch] = useState<string | undefined>(params.search);
    const [showOnlyDeleted, setShowOnlyDeleted] = useState(
        params.showDeleted === 'true',
    );

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                search: search && search !== '' ? search : undefined,
                showDeleted: showOnlyDeleted || undefined,
            };

            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [dispatch, filtersUpdated, params, search, showOnlyDeleted]);

    useEffect(() => {
        if (search !== undefined) {
            const hasForbiddenChar = containsForbiddenCharacter(search);
            setHasError(hasForbiddenChar);
            const newErrors = hasForbiddenChar
                ? [formatMessage(MESSAGES.forbiddenChars)]
                : [];
            setTextSearchErrors(newErrors);
        }
    }, [search, formatMessage]);

    useEffect(() => {
        onErrorChange(hasError);
    }, [hasError, onErrorChange]);

    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={(key, value) => {
                            setSearch(value);
                            setFiltersUpdated(true);
                        }}
                        value={search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        errors={textSearchErrors}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={(key, value) => {
                            setShowOnlyDeleted(value);
                            setFiltersUpdated(true);
                        }}
                        value={showOnlyDeleted}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
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
