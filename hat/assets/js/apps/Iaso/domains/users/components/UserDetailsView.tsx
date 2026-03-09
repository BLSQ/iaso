import React, { useCallback } from 'react';
import { Grid, Container, Stack, Box } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import Page404 from 'Iaso/components/errors/Page404';
import { baseUrls } from 'Iaso/constants/urls';
import { GeneralInfoWidgetPaper } from 'Iaso/domains/users/components/UserDetailViewComponents/GeneralInfoWidgetPaper';
import { LocationsInfoWidgetPaper } from 'Iaso/domains/users/components/UserDetailViewComponents/LocationsInfoWidgetPaper';
import { ProjectsInfoWidgetPaper } from 'Iaso/domains/users/components/UserDetailViewComponents/ProjectsInfoWidgetPaper';
import { TopActions } from 'Iaso/domains/users/components/UserDetailViewComponents/TopActions';
import { useDeleteProfile } from 'Iaso/domains/users/hooks/useDeleteProfile';
import { useGetProfile } from 'Iaso/domains/users/hooks/useGetProfiles';
import { useSavePassword } from 'Iaso/domains/users/hooks/useSavePassword';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import MESSAGES from 'Iaso/domains/users/messages';
import { userHasPermission } from 'Iaso/domains/users/utils';
import * as Permission from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { PermissionsInfoWidgetPaper } from './UserDetailViewComponents/PermissionsInfoWidgetPaper';
import { UserRolesInfoWidgetPaper } from './UserDetailViewComponents/UserRolesInfoWidgetPaper';

type Props = {
    userId?: string;
};

export const UserDetailsView = ({ userId }: Props) => {
    const {
        data: profile,
        isLoading: isLoading,
        error: error,
    } = useGetProfile(userId);
    const redirectTo = useRedirectTo();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: saveProfile, isLoading: savingProfile } = useSaveProfile({
        id: userId,
    });
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
    }, [deleteProfile, redirectTo]);

    if (!isLoading && error?.status === 404) {
        return (
            <Page404
                customMessage={formatMessage(MESSAGES.userNotFound)}
                displayTopBar={false}
            />
        );
    }

    return (
        <Container
            disableGutters
            sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}
            maxWidth={'xl'}
        >
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Stack spacing={2}>
                    <Box sx={{ px: 2 }}>
                        <Grid container>
                            <Grid
                                item
                                xs={12}
                                sx={{
                                    justifyContent: 'flex-end',
                                    display: 'flex',
                                }}
                            >
                                <Stack direction={'row'} spacing={2}>
                                    <TopActions
                                        saveProfile={saveProfile}
                                        profile={profile}
                                        onDeleteProfile={onDeleteProfile}
                                        userId={userId}
                                        savePassword={savePassword}
                                        canBypassProjectRestrictions={
                                            canBypassProjectRestrictions
                                        }
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ px: 2 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <GeneralInfoWidgetPaper
                                    profile={profile}
                                    savingProfile={savingProfile}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ px: 2 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <ProjectsInfoWidgetPaper
                                    profile={profile}
                                    savingProfile={savingProfile}
                                />
                                <LocationsInfoWidgetPaper
                                    profile={profile}
                                    savingProfile={savingProfile}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <UserRolesInfoWidgetPaper
                                    profile={profile}
                                    savingProfile={savingProfile}
                                />
                                <PermissionsInfoWidgetPaper
                                    profile={profile}
                                    savingProfile={savingProfile}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Stack>
            )}
        </Container>
    );
};
