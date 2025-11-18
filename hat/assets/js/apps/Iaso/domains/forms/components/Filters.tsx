import React, { useState, FunctionComponent, useCallback } from 'react';

import Add from '@mui/icons-material/Add';
import { Grid, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';

import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useQueryString } from 'Iaso/hooks/useApiParams';
import * as Permission from 'Iaso/utils/permissions';
import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetPlanningsOptions } from '../../plannings/hooks/requests/useGetPlannings';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { baseUrl } from '../config';
import { FormResponse, tableDefaults } from '../hooks/useGetForms';
import MESSAGES from '../messages';
import { FormsParams } from '../types/forms';
const dwnldBaseUrl = '/api/forms';
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: FormsParams;
    forms?: FormResponse;
    isLoadingForms: boolean;
};

const Filters: FunctionComponent<Props> = ({
    params,
    forms,
    isLoadingForms,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const { filters, handleSearch, handleChange } = useFilterState({
        baseUrl,
        params,
        withPagination: false,
        searchAlwaysEnabled: true,
    });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const handleShowDeleted = useCallback(
        (key, value) => {
            const valueForParam = value ? 'true' : undefined;
            handleChange(key, valueForParam);
        },
        [handleChange],
    );
    const { data: planningsDropdownOptions } = useGetPlanningsOptions();
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    const handleAddForm = useCallback(() => {
        redirectTo(baseUrls.formDetail, {
            formId: '0',
        });
    }, [redirectTo]);

    const downloadQueryString = useQueryString(
        { ...params, all: 'true' },
        tableDefaults,
    );
    const csvUrl = `${dwnldBaseUrl}/?${downloadQueryString}&csv=true`;
    const xlsxUrl = `${dwnldBaseUrl}/?${downloadQueryString}&xlsx=true`;
    return (
        <Grid container>
            <Grid container item xs={12} spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        blockForbiddenChars
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="projectsIds"
                        onChange={handleChange}
                        value={filters.projectsIds}
                        type="select"
                        options={allProjects}
                        label={MESSAGES.projects}
                        loading={isFetchingProjects}
                        onEnterPressed={handleSearch}
                        clearable
                        multi
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        multi
                        label={MESSAGES.orgUnitsTypes}
                        value={filters.orgUnitTypeIds}
                        loading={isFetchingOuTypes}
                        options={orgUnitTypes ?? []}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="planning"
                        onChange={handleChange}
                        value={filters.planning}
                        label={MESSAGES.planning}
                        options={planningsDropdownOptions}
                    />
                </Grid>
            </Grid>
            <Grid container item xs={12} spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={handleShowDeleted}
                        value={filters.showDeleted === 'true'}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
                    />
                </Grid>
                <Grid item xs={12} md={9}>
                    <Box
                        mt={isLargeLayout ? 3 : 0}
                        display="flex"
                        justifyContent="flex-end"
                    >
                        <DisplayIfUserHasPerm permissions={[Permission.FORMS]}>
                            <Button
                                variant="outlined"
                                className={classes.button}
                                color="primary"
                                onClick={handleAddForm}
                                data-test="add-form-button"
                                sx={{
                                    mr: 2,
                                }}
                            >
                                <Add className={classes.buttonIcon} />
                                {formatMessage(MESSAGES.addForm)}
                            </Button>
                        </DisplayIfUserHasPerm>
                        <SearchButton
                            disabled={textSearchError}
                            onSearch={handleSearch}
                        />
                    </Box>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <DownloadButtonsComponent
                            variant="outlined"
                            xlsxUrl={xlsxUrl}
                            csvUrl={csvUrl}
                            disabled={isLoadingForms || !forms?.forms?.length}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { Filters };
