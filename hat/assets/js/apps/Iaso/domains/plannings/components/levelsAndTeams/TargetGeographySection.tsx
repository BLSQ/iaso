import React, { FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { makeFullModal, useSafeIntl } from 'bluesquare-components';
import { useApiTeamsDropdownList } from 'Iaso/api/teams';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { CreateEditTeam } from 'Iaso/domains/teams/components/CreateEditTeam';
import { Team } from 'Iaso/domains/teams/types/team';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import { useGetPlanningRootOrgUnit } from '../../hooks/requests/useGetPlanningRootOrgUnit';
import { usePlanningFieldHandlers } from '../../hooks/usePlanningFieldHandlers';
import MESSAGES from '../../messages';
import { PlanningStepCard } from '../shared/PlanningStepCard';

const styles = {
    caption: {
        display: 'block',
        mt: 1,
        ml: 1.5,
    },
    createTeam: {
        mt: 1,
        ml: 1.5,
    },
} satisfies SxStyles;

const CreateTeamButton: FC<{ onClick: () => void }> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={styles.createTeam}
        >
            <Typography variant="body2" color="text.secondary">
                {formatMessage(MESSAGES.or)}
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={onClick}>
                {formatMessage(MESSAGES.createNewRootTeam)}
            </Button>
        </Stack>
    );
};

const CreateRootTeamModal = makeFullModal(CreateEditTeam, CreateTeamButton);

export const TargetGeographySection: FC = () => {
    const { formik, isReadOnly } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    const { values } = formik;
    const { onChange, getErrors } = usePlanningFieldHandlers(formik);

    const { data: selectedOrgUnit } = useGetPlanningRootOrgUnit(
        values.selectedOrgUnit,
    );
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useApiTeamsDropdownList(
            { projects: values?.project ? [values.project] : [] },
            {
                query: {
                    enabled: Boolean(values.project),
                },
            },
        );

    const onConfirmOrgUnit = useCallback(
        (orgUnit?: OrgUnit) => onChange('selectedOrgUnit', orgUnit?.id ?? null),
        [onChange],
    );
    const onChangeTeam = useCallback(
        (keyValue: string, teamId?: string) =>
            onChange(keyValue, teamId ? Number(teamId) : null),
        [onChange],
    );
    const onTeamCreated = useCallback(
        (team: Team) => onChange('selectedTeam', team.id),
        [onChange],
    );

    return (
        <PlanningStepCard
            step={1}
            title={formatMessage(MESSAGES.targetGeographyAndRootTeam)}
            description={formatMessage(
                MESSAGES.targetGeographyAndRootTeamInfos,
            )}
        >
            <Grid container columnSpacing={2}>
                <Grid item xs={12} md={6}>
                    <OrgUnitTreeviewModal
                        titleMessage={MESSAGES.selectOrgUnit}
                        onConfirm={onConfirmOrgUnit}
                        initialSelection={
                            values.selectedOrgUnit ? selectedOrgUnit : undefined
                        }
                        errors={getErrors('selectedOrgUnit')}
                        required
                        disabled={isReadOnly}
                    />
                    {values.selectedOrgUnit && selectedOrgUnit?.parent_name && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={styles.caption}
                        >
                            {selectedOrgUnit.parent_name}
                        </Typography>
                    )}
                </Grid>
                <Grid item xs={12} md={6} sx={{ pt: 2 }}>
                    <InputComponent
                        type="select"
                        keyValue="selectedTeam"
                        onChange={onChangeTeam}
                        value={values.selectedTeam?.toString()}
                        errors={getErrors('selectedTeam')}
                        label={MESSAGES.rootTeam}
                        required
                        options={teamsDropdown ?? []}
                        loading={isFetchingTeams}
                        disabled={isReadOnly || !values.project}
                        withMarginTop={false}
                    />
                    {!isReadOnly && (
                        <CreateRootTeamModal
                            dialogType="create"
                            defaultValues={{ project: values.project }}
                            onSuccess={onTeamCreated}
                        />
                    )}
                </Grid>
            </Grid>
        </PlanningStepCard>
    );
};
