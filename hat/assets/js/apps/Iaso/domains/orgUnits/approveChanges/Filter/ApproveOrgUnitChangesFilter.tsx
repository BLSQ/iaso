import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../../../components/FilterButton';
import { useFilterState } from '../../../../hooks/useFilterState';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../components/TreeView/requests';
import { useGetGroupDropdown } from '../../hooks/requests/useGetGroups';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { DropdownOptions } from '../../../../types/utils';

const baseUrl = baseUrls.orgUnitsChangeRequest;
type Props = { params: any };

export const ApproveOrgUnitChangesFilter: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: initialOrgUnit } = useGetOrgUnit(params.parent_id);
    const { data: groupOptions, isLoading: isLoadingGroups } =
        useGetGroupDropdown({});
    const { data: orgUnitTypeOptions, isLoading: isLoadingTypes } =
        useGetOrgUnitTypesDropdownOptions();

    const statusOptions: DropdownOptions<string>[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.new),
                value: 'new',
            },
            {
                label: formatMessage(MESSAGES.rejected),
                value: 'rejected',
            },
            {
                label: formatMessage(MESSAGES.approved),
                value: 'approved',
            },
        ],
        [formatMessage],
    );

    return (
        <Grid container spacing={2}>
            <Grid container item xs={6} md={4} lg={3} spacing={0}>
                <Grid item xs={12}>
                    <InputComponent
                        type="select"
                        multi
                        clearable
                        keyValue="org_unit_type_id"
                        value={filters.org_unit_type_id}
                        onChange={handleChange}
                        loading={isLoadingTypes}
                        options={orgUnitTypeOptions}
                        labelString={formatMessage(MESSAGES.orgUnitType)}
                    />
                </Grid>
                <Grid item xs={12}>
                    <InputComponent
                        type="select"
                        multi
                        clearable
                        keyValue="status"
                        value={filters.status}
                        onChange={handleChange}
                        withMarginTop={false}
                        options={statusOptions}
                        labelString={formatMessage(MESSAGES.status)}
                    />
                </Grid>
            </Grid>
            <Grid container item xs={6} md={4} lg={3}>
                <Grid item xs={12}>
                    <InputComponent
                        type="select"
                        multi
                        clearable
                        keyValue="groups"
                        value={filters.groups}
                        onChange={handleChange}
                        options={groupOptions}
                        loading={isLoadingGroups}
                        labelString={formatMessage(MESSAGES.group)}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Box mb={1}>
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.parent}
                            onConfirm={orgUnit => {
                                // TODO rename levels in to parent
                                handleChange('parent_id', orgUnit?.id);
                            }}
                            // source={dataSourceId}
                            // version={sourceVersionId}
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
            </Grid>
            <Grid container item xs={12} md={4} lg={6}>
                <Box
                    display="flex"
                    justifyContent="flex-start"
                    alignItems="end"
                    flexDirection="column"
                    width="100%"
                >
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};
