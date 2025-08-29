import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import { SearchButton } from 'Iaso/components/SearchButton';
import DatesRange from '../../../components/filters/DatesRange';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import MESSAGES from '../messages';

type Props = {
    params: Record<string, string>;
};

export const UsersHistoryFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.usersHistory, params });

    const { data: initialOrgUnit } = useGetOrgUnit(params.org_unit_id);
    const { data: selectedUsers } = useGetProfilesDropdown(filters.user_ids);

    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4} lg={3}>
                    <Box mt={2}>
                        <AsyncSelect
                            keyValue="user_ids"
                            label={MESSAGES.users}
                            value={selectedUsers ?? ''}
                            onChange={handleChangeUsers}
                            debounceTime={500}
                            multi
                            fetchOptions={input => getUsersDropDown(input)}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4} lg={3}>
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.location}
                        onConfirm={orgUnit => {
                            handleChange('org_unit_id', orgUnit?.id);
                        }}
                        initialSelection={initialOrgUnit}
                    />
                </Grid>

                <Grid item xs={12} md={4} lg={6}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={6}
                        keyDateFrom="created_at_after"
                        keyDateTo="created_at_before"
                        onChangeDate={handleChange}
                        dateFrom={filters.created_at_after}
                        dateTo={filters.created_at_before}
                        labelFrom={MESSAGES.modifiedAfter}
                        labelTo={MESSAGES.modifiedBefore}
                    />
                </Grid>
            </Grid>
            <Grid container justifyContent="flex-end">
                <Grid item xs={12} md={4} lg={3}>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <SearchButton
                            disabled={!filtersUpdated}
                            onSearch={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>{' '}
        </>
    );
};
