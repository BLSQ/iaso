import React, { useState, FunctionComponent, useCallback } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useSafeIntl,
    useRedirectToReplace,
} from 'bluesquare-components';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrl } from '../config';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        createdBy: params.createdBy,
        importType: params.importType,
        hasProblem: params.hasProblem,
        appId: params.appId,
        appVersion: params.appVersion,
    });

    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: Params = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, tempParams);
        }
    }, [filtersUpdated, params, filters, redirectToReplace]);

    const handleChange = useCallback(
        (key: string, value: any) => {
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
                    keyValue="appId"
                    onChange={handleChange}
                    value={filters.appId}
                    type="search"
                    label={MESSAGES.app_id}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="importType"
                    onChange={handleChange}
                    value={filters.importType}
                    type="select"
                    label={MESSAGES.import_type}
                    onEnterPressed={handleSearch}
                    options={[
                        {
                            value: 'bulk',
                            label: 'Bulk Org Units and Instances',
                        },
                        { value: 'instance', label: 'Form instance' },
                        { value: 'orgUnit', label: 'Org Unit' },
                        { value: 'storageLog', label: 'Storage Logs' },
                    ]}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="hasProblem"
                    onChange={handleChange}
                    value={filters.hasProblem}
                    type="select"
                    label={MESSAGES.has_problem}
                    onEnterPressed={handleSearch}
                    options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                    ]}
                />
            </Grid>

            <Grid
                item
                xs={12}
                sm={6}
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

export { Filters };
