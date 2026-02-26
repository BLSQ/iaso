import React from 'react';
import { FunctionComponent } from 'react';
import { Grid, Container, Table, TableBody, Stack, Box } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { Project } from 'Iaso/domains/projects/types/project';
import { EditUserWithButtonDialog } from 'Iaso/domains/users/components/EditUserDialog';
import { useGetProfile } from 'Iaso/domains/users/hooks/useGetProfiles';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import MESSAGES from 'Iaso/domains/users/messages';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { SxStyles } from 'Iaso/types/general';
import * as Permission from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { EditPasswordUserWithButtonDialog } from 'Iaso/domains/users/components/EditPasswordUserDialog';
import { useSavePassword } from 'Iaso/domains/users/hooks/useSavePassword';

type Props = {
    userId?: string;
};

const styles: SxStyles = {
    badge: {
        // @ts-ignore
        border: theme => `3px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme => theme.spacing(3),
        width: theme => theme.spacing(3),
        height: theme => theme.spacing(3),
        display: 'inline-block',
        outline: 'none !important',
    },
};

export const UserDetailsView: FunctionComponent<Props> = ({ userId }) => {
    const {
        data: profile,
        isLoading: isLoading,
        error: error,
    } = useGetProfile(userId);

    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: saveProfile, isLoading: savingProfile } = useSaveProfile();
    const {mutate : savePassword} = useSavePassword();
    const canBypassProjectRestrictions = userHasPermission(
        Permission.USERS_ADMIN,
        currentUser,
    );

    const generalIsLoading = savingProfile || isLoading;

    return (
        <Container sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>
            <Stack spacing={2}>
                <Grid container>
                    <Grid item xs={12}>
                        <EditUserWithButtonDialog
                            initialData={profile}
                            titleMessage={MESSAGES.updateUser}
                            saveProfile={saveProfile}
                            canBypassProjectRestrictions={
                                canBypassProjectRestrictions
                            }
                        />
                        <EditPasswordUserWithButtonDialog
                            titleMessage={MESSAGES.updateUser}
                            savePassword={savePassword}
                        />
                        {/*<EditIconButton/>*/}
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <WidgetPaper title={'General info'}>
                            {generalIsLoading && <LoadingSpinner absolute />}

                            <Table size="small">
                                <TableBody>
                                    <Row
                                        field={{
                                            label: 'Username',
                                            value: profile?.user_name,
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'First name',
                                            value: profile?.first_name || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Last name',
                                            value: profile?.last_name || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Email',
                                            value: profile?.email || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Language',
                                            value: profile?.language || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Organization',
                                            value: profile?.organization || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Phone number',
                                            value: profile?.phone_number || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Home page',
                                            value: profile?.home_page || '-',
                                        }}
                                    />
                                    <Row
                                        field={{
                                            label: 'Color',
                                            value: (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        ...styles.badge,
                                                        backgroundColor: profile?.color,
                                                    }}
                                                    tabIndex={0}
                                                >
                                                    {' '}
                                                </Box>
                                            )
                                        }}
                                    />
                                </TableBody>
                            </Table>
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <WidgetPaper title={'Projects'}>
                            {generalIsLoading && <LoadingSpinner />}
                            {profile?.projects?.map((project: Project) => {
                                return (
                                    <div key={project?.name}>
                                        <strong>Name :</strong> {project?.name}
                                        <br />
                                        <strong>Id :</strong> {project?.id}
                                        <br />
                                        <strong>App_id :</strong>{' '}
                                        {project?.app_id}
                                        <br />
                                        <strong>color :</strong>{' '}
                                        {project?.color}
                                        <br />
                                    </div>
                                );
                            })}
                        </WidgetPaper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <WidgetPaper title={'Roles and permissions'}>
                            {generalIsLoading && <LoadingSpinner />}
                            <h3>Permissions</h3>
                            {profile?.permissions?.map(perm => (
                                <div key={perm}>
                                    <span>{perm}</span>
                                    <br />
                                </div>
                            ))}
                            <h3>User roles</h3>
                            <h3></h3>
                        </WidgetPaper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <WidgetPaper title={'Locations'}>
                            {generalIsLoading && <LoadingSpinner />}
                            {profile?.org_units?.map((orgUnit: OrgUnit) => {
                                return (
                                    <div key={orgUnit.id}>
                                        <span>{orgUnit.name}</span>
                                        <br />
                                    </div>
                                );
                            })}
                        </WidgetPaper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <WidgetPaper title={'Org unit write types'}>
                            {generalIsLoading && <LoadingSpinner />}
                        </WidgetPaper>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
};
