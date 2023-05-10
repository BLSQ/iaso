/* eslint-disable camelcase */
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Box, Grid } from '@material-ui/core';
import { FilterButton } from '../../../../components/FilterButton';
import DatesRange from '../../../../components/filters/DatesRange';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import {
    useCheckBoxFilter,
    useFilterState,
    useMultiTreeviewFilterState,
} from '../../../../hooks/useFilterState';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import MESSAGES from '../messages';
import { useGetTeamsDropdown } from '../../../teams/hooks/requests/useGetTeams';
import { TeamType } from '../../../teams/constants';
import { useGetFormsOptions } from '../../../completenessStats/hooks/api/useGetFormsOptions';
import { usePossibleFieldsDropdown } from '../../../forms/hooks/useGetPossibleFields';
import FullStarsSvg from '../../../../components/stars/FullStarsSvgComponent';
import { DuplicatesGETParams } from '../hooks/api/useGetDuplicates';
import { PaginationParams } from '../../../../types/general';
import {
    useGetBeneficiaryTypesDropdown,
    useGetUsersDropDown,
} from '../../hooks/requests';

type Params = PaginationParams & DuplicatesGETParams;

type Props = {
    params: Params;
};

// TODO move to more accessible const
const algorithmDropDown = [
    { label: 'namesim', value: 'namesim' },
    { label: 'levenshtein', value: 'levenshtein' },
    { label: 'invert', value: 'invert' },
];

const similarityDropdown = [5, 4, 3, 2, 1].map(score => {
    const offset = 200 * (score - 1);
    return { label: `${score}`, value: 1000 - offset };
});

// TODO add error management
export const DuplicatesFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl: baseUrls.entityDuplicates,
            params,
            saveSearchInHistory: false,
        });

    const { initialOrgUnits, handleOrgUnitChange } =
        useMultiTreeviewFilterState({
            // ts wrongly mark the property as not existing in type
            // @ts-ignore
            paramIds: params?.org_unit,
            handleChange,
        });

    const { checkBoxValue: showIgnored, handleCheckboxChange } =
        useCheckBoxFilter({
            initialValue: filters.ignored === 'true',
            handleChange,
            keyValue: 'ignored',
        });

    const { data: submitterTeamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropdown({
            type: TeamType.TEAM_OF_USERS,
        });
    const { data: usersDropdown, isFetching: isFetchingUsers } =
        useGetUsersDropDown();

    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetBeneficiaryTypesDropdown();

    const { data: formsDropdown, isFetching: isFetchingForms } =
        useGetFormsOptions(['possible_fields']);

    const selectedForm = useMemo(() => {
        return (formsDropdown as any[])
            ?.map(form => form.original)
            .find(original => original.id === parseInt(filters.form, 10));
    }, [filters.form, formsDropdown]);

    const { dropdown: possibleFields, isFetching: isFetchingFields } =
        usePossibleFieldsDropdown(isFetchingForms, selectedForm);

    // Reset fields if no form
    useEffect(() => {
        if (!filters.form && filters.fields) {
            handleChange('fields', undefined);
        }
    }, [filters.fields, filters.form, handleChange]);

    return (
        <Grid container spacing={0}>
            {/* Line 1 */}
            <Grid container item spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="search"
                        keyValue="search"
                        value={filters.search}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.search}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <DatesRange
                        keyDateFrom="start_date"
                        keyDateTo="end_date"
                        onChangeDate={handleChange}
                        dateFrom={filters.start_date}
                        dateTo={filters.end_date}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="entity_type"
                        value={filters.entity_type}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.entityTypes}
                        options={entityTypesDropdown}
                        loading={isFetchingEntityTypes}
                    />
                </Grid>
            </Grid>
            {/* line 2 */}
            <Grid container item spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="submitter_team"
                        value={filters.submitter_team}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.submitterTeam}
                        options={submitterTeamsDropdown}
                        loading={isFetchingTeams}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="submitter"
                        value={filters.submitter}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.submitter}
                        options={usersDropdown}
                        loading={isFetchingUsers}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="algorithm"
                        value={filters.algorithm}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.algorithm}
                        options={algorithmDropDown}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="similarity"
                        value={filters.similarity}
                        onChange={handleChange}
                        label={MESSAGES.similarity}
                        options={similarityDropdown}
                        renderOption={option => (
                            <FullStarsSvg
                                // @ts-ignore
                                score={parseInt(option.label as string, 10)}
                            />
                        )}
                    />
                </Grid>
            </Grid>
            {/* line 3 */}
            <Grid container item spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="form"
                        value={filters.form}
                        onChange={handleChange}
                        label={MESSAGES.form}
                        options={formsDropdown}
                        loading={isFetchingForms}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="fields"
                        value={filters.fields}
                        onChange={handleChange}
                        label={MESSAGES.comparedFields}
                        options={possibleFields}
                        loading={isFetchingFields}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.location}
                            onConfirm={handleOrgUnitChange}
                            multiselect
                            initialSelection={initialOrgUnits}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="checkbox"
                        value={showIgnored}
                        keyValue="ignored"
                        // TODO put in callback
                        onChange={handleCheckboxChange}
                        label={MESSAGES.showIgnored}
                    />
                </Grid>
            </Grid>
            {/* line 4 */}
            <Grid container item xs={12} justifyContent="flex-end" spacing={2}>
                <Box mb={2}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
