import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { FilterButton } from '../../../components/FilterButton';
import DatesRange from '../../../components/filters/DatesRange';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import MESSAGES from './messages';

type Props = {
    params: any;
};

// TODO add error management
export const DuplicatesFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl: baseUrls.entityDuplicates,
            params,
            saveSearchInHistory: false,
        });
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.orgUnitId);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const [showIgnored, setShowIgnored] = useState<boolean>(
        filters.ignored === 'true',
    );

    useSkipEffectOnMount(() => {
        setInitialOrgUnitId(params?.orgUnitId);
    }, [params]);

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('orgUnitId', id);
        },
        [handleChange],
    );
    return (
        <>
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
                            onChangeDate={handleChange}
                            dateFrom={filters.start_date}
                            dateTo={filters.end_date}
                            labelFrom={MESSAGES.startDatefrom}
                            labelTo={MESSAGES.endDateUntil}
                        />
                    </Grid>
                    <Grid container item xs={3} justifyContent="flex-end">
                        <Box mt={2} mb={2}>
                            <FilterButton
                                disabled={!filtersUpdated}
                                onFilter={handleSearch}
                            />
                        </Box>
                    </Grid>
                </Grid>
                {/* line 2 */}
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            type="select"
                            multi
                            keyValue="types"
                            value={filters.types}
                            onChange={handleChange}
                            onEnterPressed={handleSearch}
                            label={MESSAGES.entityTypes}
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
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            type="select"
                            keyValue="submitter_team"
                            value={filters.submitter_team}
                            onChange={handleChange}
                            onEnterPressed={handleSearch}
                            label={MESSAGES.submitterTeam}
                        />
                    </Grid>
                </Grid>
                {/* line 3 */}
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={3}>
                        <Box id="ou-tree-input">
                            <OrgUnitTreeviewModal
                                toggleOnLabelClick={false}
                                titleMessage={MESSAGES.location}
                                onConfirm={handleOrgUnitChange}
                                initialSelection={initialOrgUnit}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            type="checkbox"
                            multi
                            keyValue="ignored"
                            value={showIgnored}
                            onChange={(key, value) => {
                                handleChange('ignored', !showIgnored);
                                setShowIgnored(value);
                            }}
                            onEnterPressed={handleSearch}
                            label={MESSAGES.showIgnored}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
