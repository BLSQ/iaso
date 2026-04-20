import React, { useCallback } from 'react';
import { Masonry } from '@mui/lab';
import { Stack, Box } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import Page404 from 'Iaso/components/errors/Page404';
import { baseUrls } from 'Iaso/constants/urls';
import { GeneralInfoWidgetPaper } from 'Iaso/domains/users/components/UserDetailViewComponents/GeneralInfoWidgetPaper';
import { LocationsInfoWidgetPaper } from 'Iaso/domains/users/components/UserDetailViewComponents/LocationsInfoWidgetPaper';
import { OrgUnitWriteTypePaper } from 'Iaso/domains/users/components/UserDetailViewComponents/OrgUnitWriteTypePaper';
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
        <Box>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Stack spacing={2}>
                    <Box pt={4} px={2}>
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="flex-end"
                        >
                            <TopActions
                                saveProfile={saveProfile}
                                onDeleteProfile={onDeleteProfile}
                                userId={userId}
                                savePassword={savePassword}
                                canBypassProjectRestrictions={
                                    canBypassProjectRestrictions
                                }
                            />
                        </Stack>
                    </Box>
                    <Masonry columns={{ xs: 1, md: 2 }} spacing={4}>
                        <Box>
                            <GeneralInfoWidgetPaper
                                profile={profile}
                                savingProfile={savingProfile}
                            />
                        </Box>
                        <Box>
                            <PermissionsInfoWidgetPaper
                                profile={profile}
                                savingProfile={savingProfile}
                            />
                        </Box>
                        <Box>
                            <ProjectsInfoWidgetPaper
                                profile={profile}
                                savingProfile={savingProfile}
                            />
                        </Box>
                        <Box>
                            <LocationsInfoWidgetPaper
                                profile={profile}
                                savingProfile={savingProfile}
                            />
                        </Box>
                        <Box>
                            <UserRolesInfoWidgetPaper
                                profile={profile}
                                savingProfile={savingProfile}
                            />
                        </Box>
                        <Box>
                            <OrgUnitWriteTypePaper
                                savingProfile={savingProfile}
                                profile={profile}
                            />
                        </Box>
                    </Masonry>
                </Stack>
            )}
        </Box>
    );
};
