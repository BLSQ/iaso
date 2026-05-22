import React, { useCallback, useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import { useFormikContext } from 'formik';
import { useAppLocales } from 'Iaso/domains/app/constants';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { useGetProjectsDropdownOptions } from 'Iaso/domains/projects/hooks/requests';
import { useGetTeamsDropdown } from 'Iaso/domains/teams/hooks/requests/useGetTeams';
import { useGetUserRolesDropDown } from 'Iaso/domains/userRoles/hooks/requests/useGetUserRoles';
import { useGetPermissionsDropDown } from 'Iaso/domains/users/hooks/useGetPermissionsDropdown';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../../messages';

interface DefaultValuesSectionProps {
    defaults: ReturnType<typeof useFormikContext>['values'];
    errors?: Record<string, string>;
    setFieldValue: ReturnType<typeof useFormikContext>['setFieldValue'];
}

export const DefaultValuesSection: React.FC<DefaultValuesSectionProps> = ({
    defaults,
    errors,
    setFieldValue,
}) => {
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<OrgUnit[]>([]);

    const { data: permissionsData, isLoading: isLoadingPermissions } =
        useGetPermissionsDropDown({ outputValueField: 'id' });
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions(true, true);
    const { data: userRolesData, isLoading: isLoadingUserRoles } =
        useGetUserRolesDropDown();
    const { data: teamsData, isFetching: isFetchingTeams } =
        useGetTeamsDropdown({});
    const appLocales = useAppLocales();

    const availableProjects = useMemo(() => {
        if (!allProjects) {
            return [];
        }
        return allProjects.map(project => {
            return {
                value: project.value,
                label: project.label,
                color: project.color,
            };
        });
    }, [allProjects]);

    const languageOptions = appLocales.map(locale => ({
        label: locale.label,
        value: locale.code,
    }));

    const selectedUserRoleIds = useMemo(() => {
        return defaults.default_user_roles?.map(Number) ?? [];
    }, [defaults.default_user_roles]);

    const selectedProjectIds = useMemo(() => {
        return defaults.default_projects?.map(Number) ?? [];
    }, [defaults.default_projects]);

    const selectedTeamIds = useMemo(() => {
        return defaults.default_teams?.map(Number) ?? [];
    }, [defaults.default_teams]);

    const handlePermissionChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const permissionIds = selectedIds.map(Number);
            setFieldValue(_key, permissionIds, true);
        },
        [setFieldValue],
    );

    const handleUserRolesChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const roleIds = selectedIds.map(Number);
            setFieldValue(_key, roleIds, true);
        },
        [setFieldValue],
    );

    const handleProjectsChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const projectIds = selectedIds.map(Number);
            setFieldValue(_key, projectIds, true);
        },
        [setFieldValue],
    );

    const handleLanguageChange = useCallback(
        (_key: string, value: string) => {
            setFieldValue(_key, value, true);
        },
        [setFieldValue],
    );

    const handleTeamsChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const teamIds = selectedIds.map(Number);
            setFieldValue(_key, teamIds, true);
        },
        [setFieldValue],
    );

    const handleOrganizationChange = useCallback(
        (_key: string, value: string) => {
            setFieldValue(_key, value, true);
        },
        [setFieldValue],
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="default_permissions"
                    label={MESSAGES.permissions}
                    value={defaults.default_permissions?.map(String) || []}
                    onChange={handlePermissionChange}
                    options={permissionsData || []}
                    loading={isLoadingPermissions}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="default_user_roles"
                    label={MESSAGES.userRoles}
                    value={selectedUserRoleIds}
                    onChange={handleUserRolesChange}
                    options={userRolesData || []}
                    loading={isLoadingUserRoles}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="default_projects"
                    label={MESSAGES.projects}
                    value={selectedProjectIds}
                    onChange={handleProjectsChange}
                    options={availableProjects}
                    loading={isFetchingProjects}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <InputComponent
                    type="select"
                    keyValue="default_profile_language"
                    label={MESSAGES.language}
                    value={defaults.default_profile_language || ''}
                    onChange={handleLanguageChange}
                    options={languageOptions}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="default_teams"
                    label={MESSAGES.teams}
                    value={selectedTeamIds}
                    onChange={handleTeamsChange}
                    options={teamsData || []}
                    loading={isFetchingTeams}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <InputComponent
                    type="text"
                    keyValue="default_organization"
                    label={MESSAGES.organization}
                    value={defaults.default_organization || ''}
                    onChange={handleOrganizationChange}
                    errors={
                        errors?.default_organization
                            ? [errors?.default_organization]
                            : undefined
                    }
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.selectedOrgUnits}
                    onConfirm={orgUnitsList => {
                        setSelectedOrgUnits(orgUnitsList || []);
                        const orgUnitIds = orgUnitsList
                            ? // Treeview's org unit id is a string and not the `number`expected by `OrgUnit`
                              orgUnitsList.map((ou: OrgUnit | { id: string }) =>
                                  parseInt(ou.id as string, 10),
                              )
                            : [];

                        setFieldValue('default_org_units', orgUnitIds, true);
                    }}
                    multiselect
                    initialSelection={selectedOrgUnits}
                />
            </Grid>
        </Grid>
    );
};
