import React, { FunctionComponent, useState, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { AddButton, useSafeIntl } from 'bluesquare-components';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { SearchButton } from 'Iaso/components/SearchButton';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { CreateEditMissionDialog } from './CreateEditMissionDialog';
import MESSAGES from '../messages';
import { MissionParams } from '../types';

type Props = {
    params: MissionParams;
};

const useMissionTypeOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'FORM_FILLING',
                label: formatMessage(MESSAGES.FORM_FILLING),
            },
            {
                value: 'ORG_UNIT_AND_FORM',
                label: formatMessage(MESSAGES.ORG_UNIT_AND_FORM),
            },
            {
                value: 'ENTITY_AND_FORM',
                label: formatMessage(MESSAGES.ENTITY_AND_FORM),
            },
        ],
        [formatMessage],
    );
};

const baseUrl = baseUrls.missions;
export const MissionFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();
    const missionTypeOptions = useMissionTypeOptions();
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
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="missionType"
                        onChange={handleChange}
                        value={filters.missionType}
                        options={missionTypeOptions}
                        label={MESSAGES.missionType}
                        clearable
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
                        <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                            <CreateEditMissionDialog
                                renderTrigger={({ openDialog }) => (
                                    <AddButton
                                        onClick={openDialog}
                                        id="create-mission"
                                    />
                                )}
                            />
                        </DisplayIfUserHasPerm>
                    </Box>
                </Grid>
            </Grid>
        </Grid>
    );
};
