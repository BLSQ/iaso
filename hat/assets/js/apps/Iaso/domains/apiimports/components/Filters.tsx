import React, { FunctionComponent, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { useFilterState } from 'Iaso/hooks/useFilterState';
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
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrl, params });
    const typeOptions = useMemo(
        () => [
            { value: 'bulk', label: 'Bulk Org Units and Instances' },
            { value: 'instance', label: 'Form instance' },
            { value: 'orgUnit', label: 'Org Unit' },
            { value: 'storageLog', label: 'Storage Logs' },
        ],
        [],
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="appId"
                    onChange={(_key, value) => handleChange('appId', value)}
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
                    onChange={(_key, value) =>
                        handleChange('importType', value)
                    }
                    value={filters.importType}
                    type="select"
                    label={MESSAGES.import_type}
                    onEnterPressed={handleSearch}
                    options={typeOptions}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="hasProblem"
                    onChange={(_key, value) =>
                        handleChange('hasProblem', value)
                    }
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
