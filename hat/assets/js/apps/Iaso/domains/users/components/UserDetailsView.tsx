import React, { useCallback } from 'react';
import { FunctionComponent } from 'react';
import {
    Grid,
    Container,
    Table,
    TableBody,
    Stack,
    Box,
    List,
    ListItem,
    Chip,
    Alert,
} from '@mui/material';
import {
    LoadingSpinner,
    textPlaceholder, useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { ProjectChip } from 'Iaso/domains/projects/components/ProjectChip';
import { EditPasswordUserWithButtonDialog } from 'Iaso/domains/users/components/EditPasswordUserDialog';
import { EditUserWithButtonDialog } from 'Iaso/domains/users/components/EditUserDialog';
import { useDeleteProfile } from 'Iaso/domains/users/hooks/useDeleteProfile';
import { useGetProfile } from 'Iaso/domains/users/hooks/useGetProfiles';
import { useSavePassword } from 'Iaso/domains/users/hooks/useSavePassword';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import MESSAGES from 'Iaso/domains/users/messages';
import {
    userHasOneOfPermissions,
    userHasPermission,
} from 'Iaso/domains/users/utils';
import { SxStyles } from 'Iaso/types/general';
import * as Permission from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { DeleteButton } from './DeleteButton';
import { PermissionTable } from './PermissionTable';
import { useDelete } from 'Iaso/domains/entities/entityTypes/hooks/requests/entitiyTypes';
import { baseUrls } from 'Iaso/constants/urls';

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
    const { data: profile, isLoading: isLoading } = useGetProfile(userId);
    const redirectTo = useRedirectTo();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: saveProfile, isLoading: savingProfile } =
        useSaveProfile(userId);
    const { mutate: deleteProfile } = useDeleteProfile(userId);

    const { mutate: savePassword } = useSavePassword(userId);
    const canBypassProjectRestrictions = userHasPermission(
        Permission.USERS_ADMIN,
        currentUser,
    );

    const onDeleteProfile = useCallback(() => {
        deleteProfile(undefined, {
            onSuccess: () => {
                redirectTo(baseUrls.users)
            }
        })
    }, [deleteProfile])

    const generalIsLoading = savingProfile || isLoading;

    return (
        <Container
            disableGutters
            sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}
            maxWidth={'xl'}
        >
            <Stack spacing={2}>
                <Box sx={{ px: 2 }}>
                    <Grid container>
                        <Grid
                            item
                            xs={12}
                            sx={{ justifyContent: 'flex-end', display: 'flex' }}
                        >
                            <Stack direction={'row'} spacing={2}>
                                <EditUserWithButtonDialog
                                    initialData={profile}
                                    titleMessage={MESSAGES.updateUser}
                                    saveProfile={saveProfile}
                                    canBypassProjectRestrictions={
                                        canBypassProjectRestrictions
                                    }
                                />
                                <EditPasswordUserWithButtonDialog
                                    titleMessage={MESSAGES.updateUserPassword}
                                    savePassword={savePassword}
                                    userId={userId}
                                />
                                {currentUser.id.toString() !== userId &&
                                    userHasOneOfPermissions(
                                        [
                                            Permission.USERS_ADMIN,
                                            Permission.USERS_MANAGEMENT,
                                        ],
                                        currentUser,
                                    ) && (
                                        <DeleteDialog
                                            titleMessage={
                                                MESSAGES.deleteUserTitle
                                            }
                                            message={MESSAGES.deleteUserText}
                                            onConfirm={onDeleteProfile}
                                            Trigger={DeleteButton}
                                        />
                                    )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
                <Box sx={{ px: 2 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <WidgetPaper title={'General info'}>
                                {generalIsLoading && (
                                    <LoadingSpinner absolute />
                                )}

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
                                                value:
                                                    profile?.first_name ||
                                                    textPlaceholder,
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Last name',
                                                value:
                                                    profile?.last_name ||
                                                    textPlaceholder,
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Email',
                                                value: profile?.email ? (
                                                    <a
                                                        href={`mailto:${profile?.email}`}
                                                    >
                                                        {profile?.email}
                                                    </a>
                                                ) : (
                                                    textPlaceholder
                                                ),
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Language',
                                                value:
                                                    profile?.language ||
                                                    textPlaceholder,
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Organization',
                                                value:
                                                    profile?.organization ||
                                                    textPlaceholder,
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Phone number',
                                                value: profile?.phone_number ? (
                                                    <a
                                                        href={`tel:${profile?.phone_number}`}
                                                    >
                                                        {profile?.phone_number}
                                                    </a>
                                                ) : (
                                                    textPlaceholder
                                                ),
                                            }}
                                        />
                                        <Row
                                            field={{
                                                label: 'Home page',
                                                value:
                                                    profile?.home_page ||
                                                    textPlaceholder,
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
                                                            backgroundColor:
                                                                profile?.color,
                                                        }}
                                                        tabIndex={0}
                                                    >
                                                        {' '}
                                                    </Box>
                                                ),
                                            }}
                                        />
                                    </TableBody>
                                </Table>
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
                <Box sx={{ px: 2 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <WidgetPaper title={'Projects'}>
                                {generalIsLoading && <LoadingSpinner />}
                                <List>
                                    {profile?.projects?.length ? (
                                        profile?.projects?.map(project => {
                                            return (
                                                <ListItem key={project.name}>
                                                    <ProjectChip
                                                        project={project}
                                                    />
                                                </ListItem>
                                            );
                                        })
                                    ) : (
                                        <Alert
                                            color={'info'}
                                            severity={'info'}
                                            sx={{ mx: 2, mb: 2 }}
                                        >
                                            No results found.
                                        </Alert>
                                    )}
                                </List>
                            </WidgetPaper>
                            <WidgetPaper title={'Locations'}>
                                {generalIsLoading && <LoadingSpinner />}
                                {profile?.org_units?.length ? (
                                    <List>
                                        {profile?.org_units?.map(
                                            (orgUnit: OrgUnit) => (
                                                <ListItem
                                                    key={`orgUnit-${orgUnit.id}`}
                                                >
                                                    {orgUnit.name}
                                                </ListItem>
                                            ),
                                        )}
                                    </List>
                                ) : (
                                    <Alert
                                        color={'info'}
                                        severity={'info'}
                                        sx={{ mx: 2, mb: 2 }}
                                    >
                                        No results found.
                                    </Alert>
                                )}
                            </WidgetPaper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <WidgetPaper title={'User roles'}>
                                {generalIsLoading && <LoadingSpinner />}
                                {profile?.user_roles_permissions?.length ? (
                                    <List>
                                        {profile?.user_roles_permissions?.map(
                                            userRole => {
                                                return (
                                                    <ListItem
                                                        key={`user-role-${userRole.id}`}
                                                    >
                                                        <Chip
                                                            color={'primary'}
                                                            label={
                                                                userRole.name
                                                            }
                                                        />
                                                    </ListItem>
                                                );
                                            },
                                        )}
                                    </List>
                                ) : (
                                    <Alert
                                        color={'info'}
                                        severity={'info'}
                                        sx={{ mx: 2, mb: 2 }}
                                    >
                                        No results found.
                                    </Alert>
                                )}
                            </WidgetPaper>
                            <WidgetPaper
                                title={'Permissions'}
                                expandable={true}
                            >
                                {generalIsLoading && <LoadingSpinner />}
                                {profile?.permissions?.length ? (
                                    <PermissionTable
                                        data={profile?.permissions}
                                    />
                                ) : (
                                    <Alert
                                        color={'info'}
                                        severity={'info'}
                                        sx={{ mx: 2, mb: 2 }}
                                    >
                                        No results found.
                                    </Alert>
                                )}
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
            </Stack>
        </Container>
    );
};
