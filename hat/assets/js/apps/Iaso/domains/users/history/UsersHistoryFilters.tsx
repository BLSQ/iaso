import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import DatesRange from '../../../components/filters/DatesRange';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
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

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4} lg={3}>
                    <Box mt={2}>
                        <UserAsyncSelect
                            keyValue="user_ids"
                            handleChange={handleChange}
                            filterUsers={filters.user_ids}
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
