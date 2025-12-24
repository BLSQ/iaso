import React, { FunctionComponent, useState, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import { AddButton } from 'bluesquare-components';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { SearchButton } from 'Iaso/components/SearchButton';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import DatesRange from '../../../components/filters/DatesRange';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { publishingStatuses } from '../constants';
import MESSAGES from '../messages';
import { PlanningParams } from '../types';

type Props = {
    params: PlanningParams;
};

const useStatusOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () =>
            publishingStatuses.map(status => {
                return {
                    value: status,
                    label: formatMessage(MESSAGES[status]),
                };
            }),
        [formatMessage],
    );
};
const baseUrl = baseUrls.planning;
export const PlanningFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const statusOptions = useStatusOptions();
    const redirectTo = useRedirectTo();
    return (
        <Grid container spacing={0}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                        blockForbiddenChars
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                    />
                </Grid>
                <Grid item xs={12} md={2}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="publishingStatus"
                        onChange={handleChange}
                        value={filters.publishingStatus}
                        options={statusOptions}
                        label={MESSAGES.status}
                    />
                </Grid>
                <Grid item xs={12} md={2} justifyContent="flex-end">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 2,
                            height: theme => theme.spacing(7),
                            mt: 2,
                        }}
                    >
                        <SearchButton
                            disabled={textSearchError || !filtersUpdated}
                            onSearch={handleSearch}
                        />
                        <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                            <AddButton
                                message={MESSAGES.create}
                                onClick={() =>
                                    redirectTo(baseUrls.planningDetails, {
                                        mode: 'create',
                                    })
                                }
                            />
                        </DisplayIfUserHasPerm>
                    </Box>
                </Grid>
            </Grid>
        </Grid>
    );
};
