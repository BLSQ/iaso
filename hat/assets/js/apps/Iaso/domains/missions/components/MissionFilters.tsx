import React, { FunctionComponent, useState } from 'react';
import Add from '@mui/icons-material/Add';
import { Box, Grid } from '@mui/material';
import {
    commonStyles,
    LinkButton,
    theme,
    useSafeIntl,
} from 'bluesquare-components';
import type { ApiMicroplanningMissionsListParams } from 'Iaso/api/missions';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { MissionTypeDropdown } from 'Iaso/domains/missions/components/MissionTypeDropdown';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { MISSION_WRITE } from 'Iaso/utils/permissions';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';

type Props = {
    params: ApiMicroplanningMissionsListParams;
};

const baseUrl = baseUrls.missions;
export const MissionFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();

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
                    <MissionTypeDropdown
                        multi={false}
                        clearable
                        keyValue={'mission_type'}
                        handleChange={handleChange}
                        value={filters.mission_type}
                    />
                </Grid>
                <Grid item xs={12} md={4} justifyContent="flex-end">
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
                        <DisplayIfUserHasPerm permissions={[MISSION_WRITE]}>
                            <LinkButton to={`/${baseUrls.missionsCreate}`}>
                                <Add sx={commonStyles(theme).buttonIcon} />
                                {formatMessage(MESSAGES.create)}
                            </LinkButton>
                        </DisplayIfUserHasPerm>
                    </Box>
                </Grid>
            </Grid>
        </Grid>
    );
};
