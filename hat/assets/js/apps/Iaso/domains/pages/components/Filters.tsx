import { Box, Button, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import MESSAGES from '../messages';
import { baseUrl } from '../config';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';

type Params = {
    order: string;
    page: string;
    pageSize: string;
    search?: string;
};

type Props = { params: Params };
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const Filters: FunctionComponent<Props> = ({ params }) => {
    const [textSearchError, setTextSearchError] = useState(false);
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl,
            params,
        });
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );
    const { data: selectedUsers } = useGetProfilesDropdown(filters.userIds);

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
                    blockForbiddenChars
                    onErrorChange={setTextSearchError}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="needs_authentication"
                    label={MESSAGES.needsAuthentication}
                    type="select"
                    value={filters.needs_authentication}
                    onChange={handleChange}
                    options={[
                        { label: MESSAGES.yes, value: 'true' },
                        { label: MESSAGES.no, value: 'false' },
                    ]}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Box mt={2}>
                    <AsyncSelect
                        keyValue="userIds"
                        label={MESSAGES.users}
                        value={selectedUsers ?? ''}
                        onChange={handleChangeUsers}
                        debounceTime={500}
                        multi
                        fetchOptions={input => getUsersDropDown(input)}
                    />
                </Box>
            </Grid>
            <Grid container item xs={12} md={3} justifyContent="flex-end">
                <Box mt={2}>
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
            </Grid>
        </Grid>
    );
};

export default Filters;
