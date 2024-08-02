import React, { FunctionComponent } from 'react';
import { DatePicker, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import InputComponent from '../../components/forms/InputComponent';
import { AsyncSelect } from '../../components/forms/AsyncSelect';
import { useFilterState } from '../../hooks/useFilterState';
import MESSAGES from './messages';
import { getUsersDropDown } from '../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../instances/hooks/useGetProfilesDropdown';
import { useGetOrgUnit } from '../orgUnits/components/TreeView/requests';
import { useGetFormsOptions } from '../completenessStats/hooks/api/useGetFormsOptions';
import { FilterButton } from '../../components/FilterButton';
import { apiDateFormat } from '../../utils/dates';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
};

export const DeviceFilters: FunctionComponent<Props> = ({
    baseUrl,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        filters,
        filtersUpdated,
        handleChange,
        handleChangeArray: handleChangeOwners,
        handleSearch,
    } = useFilterState({ baseUrl, params });
    const { data: owners } = useGetProfilesDropdown(filters.owner);
    const { data: initialOrgUnit } = useGetOrgUnit(params.orgUnit);
    const { data: forms, isFetching: isLoadingForms } = useGetFormsOptions();

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.orgUnit}
                        onConfirm={orgUnit => {
                            handleChange('orgUnit', orgUnit?.id);
                        }}
                        initialSelection={initialOrgUnit}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        label={MESSAGES.form}
                        type="select"
                        keyValue="form"
                        value={filters.form}
                        onChange={handleChange}
                        options={forms}
                        loading={isLoadingForms}
                    />
                </Grid>
                <Grid item xs={3}>
                    <Box mt={2}>
                        <AsyncSelect
                            keyValue="owner"
                            label={MESSAGES.owner}
                            value={owners ?? ''}
                            onChange={handleChangeOwners}
                            debounceTime={500}
                            multi
                            fetchOptions={input => getUsersDropDown(input)}
                        />
                    </Box>
                </Grid>
                <Grid xs={3}>
                    <Box mt={4} display="flex" justifyContent="flex-end">
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <DatePicker
                        label={formatMessage(MESSAGES.lastUse)}
                        clearMessage={MESSAGES.clear}
                        clearable
                        currentDate={filters.lastUse || null}
                        onChange={date => {
                            handleChange(
                                'lastUse',
                                date ? date.format(apiDateFormat) : null,
                            );
                        }}
                    />
                </Grid>
                <Grid item xs={3}>
                    <DatePicker
                        label={formatMessage(MESSAGES.firstUse)}
                        clearMessage={MESSAGES.clear}
                        clearable
                        currentDate={filters.firstUse || null}
                        onChange={date => {
                            handleChange(
                                'firstUse',
                                date ? date.format(apiDateFormat) : null,
                            );
                        }}
                    />
                </Grid>
            </Grid>
        </>
    );
};
