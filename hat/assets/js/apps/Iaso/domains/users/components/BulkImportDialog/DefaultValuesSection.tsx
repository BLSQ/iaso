import React, { useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import InputComponent from '../../../../components/forms/InputComponent';
import { useAppLocales } from '../../../app/constants';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
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
        useGetPermissionsDropDown();
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
        if (!defaults.default_user_roles || !userRolesData) return [];
        return defaults.default_user_roles
            .map(name => {
                const role = userRolesData.find(r => r.label === name);
                return role?.value?.toString();
            })
            .filter(Boolean);
    }, [defaults.default_user_roles, userRolesData]);

    const selectedProjectIds = useMemo(() => {
        if (!defaults.default_projects || !availableProjects) return [];
        return defaults.default_projects
            .map(name => {
                const project = availableProjects.find(p => p.label === name);
                return project?.value?.toString();
            })
            .filter(Boolean);
    }, [defaults.default_projects, availableProjects]);

    const selectedTeamIds = useMemo(() => {
        if (!defaults.default_teams || !teamsData) return [];
        return defaults.default_teams
            .map(name => {
                const team = teamsData.find(t => t.label === name);
                return team?.value?.toString();
            })
            .filter(Boolean);
    }, [defaults.default_teams, teamsData]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <InputComponent
                    type="select"
                    multi
                    keyValue="default_permissions"
                    label={MESSAGES.permissions}
                    value={defaults.default_permissions || []}
                    onChange={(key, value) =>
                        onChange({ ...defaults, default_permissions: value })
                    }
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
                    onChange={(key, value) => {
                        const selectedIds = value ? value.split(',') : [];
                        const roleNames = selectedIds
                            .map(id => {
                                const role = userRolesData?.find(
                                    r => r.value.toString() === id,
                                );
                                return role?.label;
                            })
                            .filter(Boolean);
                        onChange({
                            ...defaults,
                            default_user_roles: roleNames as string[],
                        });
                    }}
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
                    onChange={(key, value) => {
                        const selectedIds = value ? value.split(',') : [];
                        const projectNames = selectedIds
                            .map(id => {
                                const project = availableProjects?.find(
                                    p => p.value.toString() === id,
                                );
                                return project?.label;
                            })
                            .filter(Boolean);
                        onChange({
                            ...defaults,
                            default_projects: projectNames as string[],
                        });
                    }}
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
                    onChange={(key, value) =>
                        onChange({
                            ...defaults,
                            default_profile_language: value,
                        })
                    }
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
                    onChange={(key, value) => {
                        const selectedIds = value ? value.split(',') : [];
                        const teamNames = selectedIds
                            .map(id => {
                                const team = teamsData?.find(
                                    t => t.value.toString() === id,
                                );
                                return team?.label;
                            })
                            .filter(Boolean);
                        onChange({
                            ...defaults,
                            default_teams: teamNames as string[],
                        });
                    }}
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
                    onChange={(key, value) =>
                        onChange({ ...defaults, default_organization: value })
                    }
                />
            </Grid>

            <Grid item xs={12}>
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.selectedOrgUnits}
                    onConfirm={orgUnitsList => {
                        setSelectedOrgUnits(orgUnitsList || []);
                        const orgUnitIds = orgUnitsList
                            ? orgUnitsList.map((ou: OrgUnit) => ou.id)
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
