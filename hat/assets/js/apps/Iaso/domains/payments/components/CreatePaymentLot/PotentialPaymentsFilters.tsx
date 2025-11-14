import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
    useMemo,
} from 'react';
import { Box, Grid } from '@mui/material';
import { selectionInitialState, useSafeIntl } from 'bluesquare-components';
import { SearchButton } from 'Iaso/components/SearchButton';

import DatesRange from '../../../../components/filters/DatesRange';
import { AsyncSelect } from '../../../../components/forms/AsyncSelect';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { useFilterState } from '../../../../hooks/useFilterState';
import { getUsersDropDown } from '../../../instances/hooks/requests/getUsersDropDown';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../../orgUnits/components/TreeView/requests';
import { Selection } from '../../../orgUnits/types/selection';
import { useGetUserRolesDropDown } from '../../../userRoles/hooks/requests/useGetUserRoles';
import { useGetForms } from '../../../workflows/hooks/requests/useGetForms';
import MESSAGES from '../../messages';
import { PotentialPaymentParams, PotentialPayment } from '../../types';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';

const baseUrl = baseUrls.potentialPayments;
type Props = {
    params: PotentialPaymentParams;
    setSelection: Dispatch<SetStateAction<Selection<PotentialPayment>>>;
};

export const PotentialPaymentsFilters: FunctionComponent<Props> = ({
    params,
    setSelection,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: initialOrgUnit } = useGetOrgUnit(params.parent_id);
    const { data: forms, isFetching: isLoadingForms } = useGetForms();
    const { data: userRoles, isFetching: isFetchingUserRoles } =
        useGetUserRolesDropDown();
    const formOptions = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
    const onSearch = useCallback(() => {
        setSelection(selectionInitialState);
        handleSearch();
    }, [handleSearch, setSelection]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <Box mt={2}>
                    <UserAsyncSelect
                        handleChange={handleChange}
                        filterUsers={filters.users}
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
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={onSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
