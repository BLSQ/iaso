import React, { FunctionComponent, useCallback, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetSkusDropdownOptions } from 'Iaso/domains/stock/hooks/useGetSkusDropdownOptions';
import { useGetStatus } from 'Iaso/domains/stock/hooks/useGetStatus';
import { Status } from 'Iaso/domains/stock/types/stocks';
import MESSAGES from '../../messages';
import { baseUrl } from '../config';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type VersionParams = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    status?: Status;
};

type VersionProps = {
    params: VersionParams;
};

const VersionFilters: FunctionComponent<VersionProps> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        search: params.search,
        status: params.status,
    });
    const status = useGetStatus();

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: VersionParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, tempParams);
        }
    }, [filtersUpdated, params, filters, redirectToReplace]);

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

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    onChange={handleChange}
                    keyValue="status"
                    label={MESSAGES.status}
                    value={filters.status}
                    options={status ?? []}
                />
            </Grid>
            <Grid
                item
                xs={6}
                sm={6}
                md={6}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <Button
                    data-test="search-button"
                    disabled={textSearchError || !filtersUpdated}
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
    );
};

type RulesParams = {
    pageSize: string;
    order: string;
    page: string;
    skuId?: number;
    formId?: number;
};

type RulesProps = {
    params: RulesParams;
};

const RulesFilters: FunctionComponent<RulesProps> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        skuId: params.skuId,
        formId: params.formId,
    });
    const { data: allSkus, isFetching: isFetchingSkus } =
        useGetSkusDropdownOptions({});
    const { data: allForms, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: VersionParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, tempParams);
        }
    }, [filtersUpdated, params, filters, redirectToReplace]);

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

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    type="select"
                    keyValue="skuId"
                    loading={isFetchingSkus}
                    onChange={handleChange}
                    value={filters.skuId}
                    label={MESSAGES.sku}
                    options={allSkus ?? []}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    keyValue="formId"
                    loading={isFetchingForms}
                    onChange={handleChange}
                    label={MESSAGES.form}
                    value={filters.formId}
                    options={allForms ?? []}
                />
            </Grid>
            <Grid
                item
                xs={6}
                sm={6}
                md={6}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <Button
                    data-test="search-button"
                    disabled={
                        isFetchingForms || isFetchingSkus || !filtersUpdated
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
    );
};

export { VersionFilters, RulesFilters };
