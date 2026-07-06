import React, { FunctionComponent, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useApiApiImportFiltersRetrieve } from 'Iaso/api/apiImports';
import DatesRange from 'Iaso/components/filters/DatesRange';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { DropdownOptions } from 'Iaso/types/utils';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrl } from '../config';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: Params;
};

const listAsOptions = (list?: string[]): Array<DropdownOptions<string>> => {
    return (
        list?.map(v => {
            return {
                value: v,
                label: v,
            };
        }) ?? []
    );
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrl, params });

    const { data, isFetching } = useApiApiImportFiltersRetrieve();
    const appIds = useMemo(() => listAsOptions(data?.app_ids), [data]);
    const appVersions = useMemo(
        () => listAsOptions(data?.app_versions),
        [data],
    );
    const users = useMemo(() => {
        return (
            data?.users?.map(user => {
                return {
                    value: user.id,
                    label: user.username,
                };
            }) ?? []
        );
    }, [data]);
    const typeOptions = useMemo(
        () => [
            { value: 'bulk', label: formatMessage(MESSAGES.import_type_bulk) },
            {
                value: 'instance',
                label: formatMessage(MESSAGES.import_type_instance),
            },
            {
                value: 'orgUnit',
                label: formatMessage(MESSAGES.import_type_org_unit),
            },
            {
                value: 'storageLog',
                label: formatMessage(MESSAGES.import_type_storage_logs),
            },
        ],
        [formatMessage],
    );
    const yesNoOptions = useMemo(
        () => [
            { value: 'true', label: formatMessage(MESSAGES.yes) },
            { value: 'false', label: formatMessage(MESSAGES.no) },
        ],
        [formatMessage],
    );

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4} md={2}>
                    <InputComponent
                        keyValue="appId"
                        onChange={(_key, value) => handleChange('appId', value)}
                        value={filters.appId}
                        type="select"
                        options={appIds}
                        label={MESSAGES.app_id}
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                        loading={isFetching}
                    />
                    <InputComponent
                        keyValue="hasProblem"
                        onChange={(_key, value) =>
                            handleChange('hasProblem', value)
                        }
                        value={filters.hasProblem}
                        type="select"
                        label={MESSAGES.has_problem}
                        onEnterPressed={handleSearch}
                        options={yesNoOptions}
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <InputComponent
                        keyValue="appVersion"
                        onChange={(_key, value) =>
                            handleChange('appVersion', value)
                        }
                        value={filters.appVersion}
                        type="select"
                        options={appVersions}
                        loading={isFetching}
                        label={MESSAGES.app_version}
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <InputComponent
                        keyValue="userId"
                        onChange={(_key, value) =>
                            handleChange('userId', value)
                        }
                        value={filters.userId}
                        type="select"
                        options={users}
                        loading={isFetching}
                        label={MESSAGES.user}
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
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
                <Grid item xs={12} sm={6} md={4}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.fromDate}
                        dateTo={filters.toDate}
                        keyDateFrom="fromDate"
                        keyDateTo="toDate"
                    />
                </Grid>
            </Grid>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mb: 2,
                }}
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
            </Box>
        </>
    );
};

export { Filters };
