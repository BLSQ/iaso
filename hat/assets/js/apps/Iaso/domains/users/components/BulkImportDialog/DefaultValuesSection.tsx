import React, { useCallback, useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import InputComponent from '../../../../components/forms/InputComponent';
import { useAppLocales } from '../../../app/constants';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { useGetTeamsDropdown } from '../../../teams/hooks/requests/useGetTeams';
import { useGetUserRolesDropDown } from '../../../userRoles/hooks/requests/useGetUserRoles';
import { useGetPermissionsDropDown } from '../../hooks/useGetPermissionsDropdown';
import MESSAGES from '../../messages';
import { BulkImportDefaults } from '../../types';

interface DefaultValuesSectionProps {
    defaults: BulkImportDefaults;
    onChange: (newDefaults: BulkImportDefaults) => void;
}

export const DefaultValuesSection: React.FC<DefaultValuesSectionProps> = ({
    defaults,
    onChange,
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
        return defaults.default_user_roles?.map(String) ?? [];
    }, [defaults.default_user_roles]);

    const selectedProjectIds = useMemo(() => {
        return defaults.default_projects?.map(String) ?? [];
    }, [defaults.default_projects]);

    const selectedTeamIds = useMemo(() => {
        return defaults.default_teams?.map(String) ?? [];
    }, [defaults.default_teams]);

    const handlePermissionChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const permissionIds = selectedIds.map(Number);
            onChange({
                ...defaults,
                default_permissions: permissionIds,
            });
        },
        [defaults, onChange],
    );

    const handleUserRolesChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const roleIds = selectedIds.map(Number);
            onChange({
                ...defaults,
                default_user_roles: roleIds,
            });
        },
        [defaults, onChange],
    );

    const handleProjectsChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const projectIds = selectedIds.map(Number);
            onChange({
                ...defaults,
                default_projects: projectIds,
            });
        },
        [defaults, onChange],
    );

    const handleLanguageChange = useCallback(
        (_key: string, value: string) => {
            onChange({
                ...defaults,
                default_profile_language: value,
            });
        },
        [defaults, onChange],
    );

    const handleTeamsChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = value ? value.split(',') : [];
            const teamIds = selectedIds.map(Number);
            onChange({
                ...defaults,
                default_teams: teamIds,
            });
        },
        [defaults, onChange],
    );

    const handleOrganizationChange = useCallback(
        (_key: string, value: string) => {
            onChange({ ...defaults, default_organization: value });
        },
        [defaults, onChange],
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
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

            <Grid item xs={12}>
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

            <Grid item xs={12}>
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

            <Grid item xs={12}>
                <InputComponent
                    type="select"
                    keyValue="default_profile_language"
                    label={MESSAGES.language}
                    value={defaults.default_profile_language || ''}
                    onChange={handleLanguageChange}
                    options={languageOptions}
                />
            </Grid>

            <Grid item xs={12}>
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

            <Grid item xs={12}>
                <InputComponent
                    type="text"
                    keyValue="default_organization"
                    label={MESSAGES.organization}
                    value={defaults.default_organization || ''}
                    onChange={handleOrganizationChange}
                />
            </Grid>

            <Grid item xs={12}>
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
                        onChange({
                            ...defaults,
                            default_org_units: orgUnitIds,
                        });
                    }}
                    multiselect
                    initialSelection={selectedOrgUnits}
                />
            </Grid>
        </Grid>
    );
};
