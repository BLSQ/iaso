import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import DatesRange from '../../../../components/filters/DatesRange';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { useFilterState } from '../../../../hooks/useFilterState';
import { DropdownOptions } from '../../../../types/utils';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../../orgUnits/components/TreeView/requests';
import MESSAGES from '../../messages';

import { PotentialPaymentParams } from '../../types';

const baseUrl = baseUrls.lotsPayments;
type Props = { params: PotentialPaymentParams };

export const PaymentLotsFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: initialOrgUnit } = useGetOrgUnit(params.parent_id);

    const statusOptions: DropdownOptions<string>[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.new),
                value: 'new',
            },
            {
                label: formatMessage(MESSAGES.sent),
                value: 'sent',
            },
            {
                label: formatMessage(MESSAGES.paid),
                value: 'paid',
            },
            {
                label: formatMessage(MESSAGES.partially_paid),
                value: 'partially_paid',
            },
        ],
        [formatMessage],
    );

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
                    keyValue="status"
                    value={filters.status}
                    onChange={handleChange}
                    options={statusOptions}
                    labelString={formatMessage(MESSAGES.status)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
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

            <Grid item xs={12} md={4} lg={3}>
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
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
