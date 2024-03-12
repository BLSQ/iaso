import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../../components/FilterButton';
import { useFilterState } from '../../../hooks/useFilterState';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';

import DatesRange from '../../../components/filters/DatesRange';
import { useGetForms } from '../../workflows/hooks/requests/useGetForms';
import { PotentialPaymentParams } from '../types';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';
import { useGetUserRolesOptions } from '../../userRoles/hooks/requests/useGetUserRoles';

const baseUrl = baseUrls.potentialPayments;
type Props = { params: PotentialPaymentParams };

export const PotentialPaymentsFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: initialOrgUnit } = useGetOrgUnit(params.parent_id);
    const { data: forms, isFetching: isLoadingForms } = useGetForms();
    const { data: selectedUsers } = useGetProfilesDropdown(filters.users);
    const { data: userRoles, isFetching: isFetchingUserRoles } =
        useGetUserRolesOptions();
    const formOptions = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
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
                            keyValue="users"
                            label={MESSAGES.user}
                            value={selectedUsers ?? ''}
                            onChange={handleChangeUsers}
                            debounceTime={500}
                            multi
                            fetchOptions={input => getUsersDropDown(input)}
                        />
                    </Box>
                    <InputComponent
                        type="select"
                        multi
                        clearable
                        keyValue="user_roles"
                        value={filters.user_roles}
                        onChange={handleChange}
                        loading={isFetchingUserRoles}
                        options={userRoles}
                        labelString={formatMessage(MESSAGES.userRoles)}
                    />
                </Grid>
                <Grid item xs={12} md={4} lg={3}>
                    <InputComponent
                        type="select"
                        multi
                        clearable
                        keyValue="forms"
                        value={filters.forms}
                        onChange={handleChange}
                        options={formOptions}
                        loading={isLoadingForms}
                        labelString={formatMessage(MESSAGES.forms)}
                    />
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.parent}
                        onConfirm={orgUnit => {
                            handleChange('parent_id', orgUnit?.id);
                        }}
                        initialSelection={initialOrgUnit}
                    />
                </Grid>

                <Grid item xs={12} md={4} lg={3}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        keyDateFrom="change_requests__created_at_after"
                        keyDateTo="change_requests__created_at_before"
                        onChangeDate={handleChange}
                        dateFrom={filters.change_requests__created_at_after}
                        dateTo={filters.change_requests__created_at_before}
                        labelFrom={MESSAGES.createdDateFrom}
                        labelTo={MESSAGES.createdDateTo}
                    />
                </Grid>
                <Grid item xs={12} md={4} lg={3}>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
