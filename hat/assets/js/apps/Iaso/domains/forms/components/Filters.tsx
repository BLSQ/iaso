import React, { useCallback, useMemo } from 'react';

import Add from '@mui/icons-material/Add';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import makeStyles from '@mui/styles/makeStyles/makeStyles';
import {
    commonStyles,
    FiltersPanel,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import type {
    FilterFieldDescriptor,
    FilterFieldRenderContext,
    FilterValues,
} from 'bluesquare-components';

import { useApiMicroplanningPlanningsDropdownList } from 'Iaso/api/plannings/endpoints/micro-plannings/micro-plannings';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { PlanningsDropdown } from 'Iaso/domains/plannings/components/shared/PlanningsDropdown';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { PLANNING_READ } from 'Iaso/utils/permissions';
import * as Permission from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { baseUrl } from '../config';
import MESSAGES from '../messages';
import { FormsParams } from '../types/forms';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: FormsParams;
};

const Filters = ({ params }: Props) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const currentUser = useCurrentUser();
    const hasPlanningPermission = userHasPermission(PLANNING_READ, currentUser);
    // Same query as PlanningsDropdown (deduped by react-query): used here
    // only to label the active-filter chip.
    const { data: plannings } = useApiMicroplanningPlanningsDropdownList(
        undefined,
        {
            query: {
                enabled: hasPlanningPermission,
            },
        },
    );

    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const handleAddForm = useCallback(() => {
        redirectTo(baseUrls.formDetail, {
            formId: '0',
        });
    }, [redirectTo]);

    // Adapter between url params (strings, `onlyDeleted: '1'`) and the
    // generic filter values (`onlyDeleted: boolean`).
    const values: FilterValues = useMemo(
        () => ({
            search: params.search,
            projectsIds: params.projectsIds,
            orgUnitTypeIds: params.orgUnitTypeIds,
            planning: params.planning,
            onlyDeleted: params.onlyDeleted === '1',
        }),
        [params],
    );

    const handleApply = useCallback(
        (next: FilterValues) => {
            redirectTo(baseUrl, {
                ...params,
                search: next.search || undefined,
                projectsIds: next.projectsIds || undefined,
                orgUnitTypeIds: next.orgUnitTypeIds || undefined,
                planning: next.planning || undefined,
                onlyDeleted: next.onlyDeleted ? '1' : undefined,
            });
        },
        [params, redirectTo],
    );

    const fields: FilterFieldDescriptor[] = useMemo(
        () => [
            {
                key: 'search',
                label: MESSAGES.search,
                type: 'search',
            },
            {
                key: 'projectsIds',
                label: MESSAGES.projects,
                type: 'select',
                multi: true,
                clearable: true,
                options: allProjects ?? [],
                loading: isFetchingProjects,
            },
            {
                key: 'orgUnitTypeIds',
                label: MESSAGES.orgUnitsTypes,
                type: 'select',
                multi: true,
                options: orgUnitTypes ?? [],
                loading: isFetchingOuTypes,
            },
            {
                key: 'planning',
                label: MESSAGES.planning,
                type: 'custom',
                multi: true,
                visible: hasPlanningPermission,
                options: plannings ?? [],
                renderCustom: ({
                    value,
                    onChange,
                }: FilterFieldRenderContext) => (
                    <PlanningsDropdown
                        handleChange={(_key, newValue) => onChange(newValue)}
                        value={value}
                        keyValue="planning"
                        multi
                        // the drawer already spaces fields: avoid
                        // InputComponent's own margin-top doubling it
                        withMarginTop={false}
                    />
                ),
            },
            {
                key: 'onlyDeleted',
                label: MESSAGES.onlyDeleted,
                type: 'checkbox',
                emptyValue: false,
            },
        ],
        [
            allProjects,
            isFetchingProjects,
            orgUnitTypes,
            isFetchingOuTypes,
            hasPlanningPermission,
            plannings,
        ],
    );

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Box flexGrow={1} minWidth={0}>
                <FiltersPanel
                    fields={fields}
                    values={values}
                    onApply={handleApply}
                />
            </Box>
            <DisplayIfUserHasPerm permissions={[Permission.FORMS]}>
                <Button
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={handleAddForm}
                    data-test="add-form-button"
                >
                    <Add className={classes.buttonIcon} />
                    {formatMessage(MESSAGES.addForm)}
                </Button>
            </DisplayIfUserHasPerm>
        </Box>
    );
};

export { Filters };
