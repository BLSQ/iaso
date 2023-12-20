import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { NOPV2_AUTH } from '../../../../constants/routes';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import MESSAGES from '../../../../constants/messages';
import { appId } from '../../../../constants/app';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { useStatusOptions } from '../hooks/statuses';
import { VaccineAuthParams } from '../types';
import { CreateAuthorisationModal } from '../Details/Modals/CreateEdit/CreateEditAuthorisationModal';

const baseUrl = NOPV2_AUTH;
type Props = { params: VaccineAuthParams };

export const Nopv2AuthorisationsFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: countryBlocksOptions, isFetching: isFetchingCountryBlocks } =
        useGetGroupDropdown({ blockOfCountries: 'True', appId });
    const statusOptions = useStatusOptions();
    return (
        <Grid container spacing={2}>
            <Grid item xs={6} md={4} lg={3}>
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="block_country"
                    value={filters.block_country}
                    onChange={handleChange}
                    loading={isFetchingCountryBlocks}
                    options={countryBlocksOptions}
                    labelString={formatMessage(MESSAGES.countryBlock)}
                />
            </Grid>
            <Grid item xs={6} md={4} lg={3}>
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="auth_status"
                    value={filters.auth_status}
                    onChange={handleChange}
                    options={statusOptions}
                    labelString={formatMessage(MESSAGES.status)}
                />
            </Grid>
            <Grid container item xs={12} md={4} lg={6}>
                <Box
                    display="flex"
                    justifyContent="flex-end"
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
                    <Box mt={2} mb={2}>
                        <CreateAuthorisationModal
                            iconProps={{ message: MESSAGES.addAuthorisation }}
                        />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};
