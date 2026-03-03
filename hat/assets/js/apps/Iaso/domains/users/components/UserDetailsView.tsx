import React, { useCallback } from 'react';
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
import Page404 from 'Iaso/components/errors/Page404';
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

export const UserDetailsView = ({ userId }: Props) => {
    const { data: profile, isLoading: isLoading, error: error } = useGetProfile(userId);
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
                redirectTo(baseUrls.users);
            },
        });
    }, [deleteProfile]);

    if (!isLoading && error?.status === 404) {
        return <Page404 customMessage={formatMessage(MESSAGES.userNotFound)} displayTopBar={false} />;
    }

    return (
        <Container
            disableGutters
            sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}
            maxWidth={'xl'}
        >
            {isLoading ? <LoadingSpinner/> :
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
                                        titleMessage={formatMessage(MESSAGES.updateUser)}
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
                                    {currentUser?.id?.toString() !== userId &&
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
                            <WidgetPaper title={formatMessage(MESSAGES.generalInfo)} data-testid={"general-info-box"}>
                                {savingProfile ? (
                                        <Box sx={{my : 2}}>
                                            <LoadingSpinner absolute={false} fixed={false}/>
                                        </Box>
                                    ) :

                                    <Table size="small">
                                        <TableBody>
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.userName),
                                                    value: profile?.user_name || textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.firstName),
                                                    value:
                                                        profile?.first_name ||
                                                        textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.lastName),
                                                    value:
                                                        profile?.last_name ||
                                                        textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.email),
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
                                                    label: formatMessage(MESSAGES.language),
                                                    value:
                                                        profile?.language ||
                                                        textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.organization),
                                                    value:
                                                        profile?.organization ||
                                                        textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.phoneNumber),
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
                                                    label: formatMessage(MESSAGES.homePage),
                                                    value:
                                                        profile?.home_page ||
                                                        textPlaceholder,
                                                }}
                                            />
                                            <Row
                                                field={{
                                                    label: formatMessage(MESSAGES.color),
                                                    value: profile?.color ? <Box
                                                            component="span"
                                                            data-testid={"user-color-badge"}
                                                            sx={{
                                                                ...styles.badge,
                                                                backgroundColor:
                                                                profile?.color,
                                                            }}
                                                            tabIndex={0}
                                                        >
                                                            {' '}
                                                        </Box> : textPlaceholder

                                                }}
                                            />
                                        </TableBody>
                                    </Table>
                                }
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
                <Box sx={{ px: 2 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <WidgetPaper title={formatMessage(MESSAGES.projects)} data-testid={"projects-info-box"}>
                                {savingProfile ? <LoadingSpinner absolute={false} fixed={false}/> :

                                        profile?.projects?.length ? (
                                            <List>
                                                {profile?.projects?.map(project => {
                                                return (
                                                    <ListItem key={project.name}>
                                                        <ProjectChip project={project}
                                                        />
                                                    </ListItem>
                                                );
                                            })}</List>
                                        ) : (
                                            <Alert
                                                color={'info'}
                                                severity={'info'}
                                                sx={{ mx: 2, mb: 2 }}
                                            >
                                                {formatMessage(MESSAGES.noResultsFound)}
                                            </Alert>
                                        )
                                }
                            </WidgetPaper>
                            <WidgetPaper title={formatMessage(MESSAGES.locations)} data-testid={'locations-info-box'}>
                                {savingProfile ? <LoadingSpinner absolute={false} fixed={false}/> :
                                    (profile?.org_units?.length ? (
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
                                            {formatMessage(MESSAGES.noResultsFound)}
                                        </Alert>
                                    ))}
                            </WidgetPaper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <WidgetPaper title={formatMessage(MESSAGES.userRoles)} data-testid={'user-roles-info-box'}>
                                {savingProfile ? <LoadingSpinner absolute={false} fixed={false}/> : (
                                    profile?.user_roles_permissions?.length ? (
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
                                            {formatMessage(MESSAGES.noResultsFound)}
                                        </Alert>
                                    ))}
                            </WidgetPaper>
                            <WidgetPaper
                                title={formatMessage(MESSAGES.permissions)}
                                expandable={true}
                                data-testid={'permissions-info-box'}
                            >
                                {savingProfile ? <LoadingSpinner absolute={false} fixed={false}/> : (
                                    profile?.permissions?.length ? (
                                        <PermissionTable
                                            data={profile?.permissions}
                                        />
                                    ) : (
                                        <Alert
                                            color={'info'}
                                            severity={'info'}
                                            sx={{ mx: 2, mb: 2 }}
                                        >
                                            {formatMessage(MESSAGES.noResultsFound)}
                                        </Alert>
                                    ))}
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
            </Stack>
            }
            </Container>
    );
};
