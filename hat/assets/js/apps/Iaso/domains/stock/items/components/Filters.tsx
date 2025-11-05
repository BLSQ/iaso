import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useDefaultSourceVersion } from 'Iaso/domains/dataSources/utils';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetDataSources } from 'Iaso/domains/orgUnits/hooks/requests/useGetDataSources';
import { useGetOrgUnit } from 'Iaso/domains/registry/hooks/useGetOrgUnit';
import { useGetImpacts } from 'Iaso/domains/stock/hooks/useGetImpacts';
import { useGetSkusDropdownOptions } from 'Iaso/domains/stock/hooks/useGetSkusDropdownOptions';
import { Params } from 'Iaso/domains/stock/items/types/filters';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { formatParams } from 'Iaso/utils/requests';
import MESSAGES from '../../messages';
import { baseUrl } from '../config';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: Params;
};

const ItemsFilters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data: allSkus, isFetching: isFetchingSkus } =
        useGetSkusDropdownOptions({});
    const { data: dataSources } = useGetDataSources(true);
    const sourceVersion = useDefaultSourceVersion();
    const dataSource = useMemo(
        () =>
            dataSources?.find(
                source => source.value === sourceVersion?.source?.id.toString(),
            )?.value || '',
        [dataSources, sourceVersion?.source?.id],
    );

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: orgUnit } = useGetOrgUnit(filters.orgUnit?.toString());

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="sku"
                    onChange={handleChange}
                    value={filters.sku}
                    type="select"
                    label={MESSAGES.sku}
                    onEnterPressed={handleSearch}
                    blockForbiddenChars
                    options={allSkus}
                    loading={isFetchingSkus}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.orgUnit}
                    source={dataSource.toString()}
                    version={sourceVersion.version.id}
                    onConfirm={orgUnit => {
                        handleChange('orgUnit', orgUnit?.id);
                    }}
                    initialSelection={orgUnit}
                    resetTrigger={true}
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
                    disabled={!filtersUpdated}
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

const DetailsFilters: FunctionComponent<Props> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        impact: params.impact,
        value: params.value,
        question: params.question,
        created_at_after: params.created_at_after,
        created_at_before: params.created_at_before,
        value_from: params.value_from,
        value_to: params.value_to,
    });

    const impacts = useGetImpacts();

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: Params = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, formatParams(tempParams));
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
                    keyValue="impact"
                    onChange={handleChange}
                    value={filters.impact}
                    type="select"
                    label={MESSAGES.impact}
                    onEnterPressed={handleSearch}
                    blockForbiddenChars
                    options={impacts}
                />
                <DatesRange
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    keyDateFrom="created_at_after"
                    keyDateTo="created_at_before"
                    onChangeDate={handleChange}
                    dateFrom={filters.created_at_after}
                    dateTo={filters.created_at_before}
                    labelFrom={MESSAGES.createdDateFrom}
                    labelTo={MESSAGES.createdDateTo}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="value"
                    onChange={handleChange}
                    value={filters.value}
                    type="number"
                    label={MESSAGES.value}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                    options={impacts}
                />
                <InputComponent
                    keyValue="value_from"
                    onChange={handleChange}
                    value={filters.value_from}
                    type="number"
                    label={MESSAGES.valueFrom}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                    options={impacts}
                />
                <InputComponent
                    keyValue="value_to"
                    onChange={handleChange}
                    value={filters.value_to}
                    type="number"
                    label={MESSAGES.valueTo}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                    options={impacts}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="question"
                    onChange={handleChange}
                    value={filters.question}
                    type="text"
                    label={MESSAGES.question}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                    options={impacts}
                />
            </Grid>
            <Grid
                item
                xs={12}
                sm={12}
                md={3}
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

export { ItemsFilters, DetailsFilters };
