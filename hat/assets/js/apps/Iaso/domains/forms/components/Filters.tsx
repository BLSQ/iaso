import React, { useState, FunctionComponent, useEffect } from 'react';

import { Grid, Button, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';

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
    hasErrors: boolean;
};

const Filters: FunctionComponent<Props> = ({
    params,
    onErrorChange,
    hasErrors,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(baseUrl, params);
    const [textSearchErrors, setTextSearchErrors] = useState<Array<string>>([]);
    const [hasError, setHasError] = useState<boolean>(false);
    const [showDeleted, setShowDeleted] = useState<boolean>(
        filters.showDeleted === 'true',
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
                        onEnterPressed={!hasError ? handleSearch : null}
                        errors={textSearchErrors}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={(key, value) => {
                            handleChange('showDeleted', !showDeleted);
                            setShowDeleted(value);
                        }}
                        value={showDeleted}
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
                        disabled={
                            (!showDeleted && !filtersUpdated) || hasErrors
                        }
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
