import React from 'react';
import { Box } from '@mui/material';
import { useRedirectTo, useRedirectToReplace } from 'bluesquare-components';
import { useApiMicroplanningMissionsDestroy } from 'Iaso/api/missions';
import { DeleteButton } from 'Iaso/components/Buttons/DeleteButton';
import { EditButton } from 'Iaso/components/Buttons/EditButton';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import * as Permissions from 'Iaso/utils/permissions';
import MESSAGES from '../../messages';

type TopActionsProps = {
    missionId: number;
    missionName: string;
};

export const TopActions: React.FunctionComponent<TopActionsProps> = ({
    missionId,
    missionName,
}) => {
    const redirectTo = useRedirectTo();

    const { mutateAsync: deleteMission } = useApiMicroplanningMissionsDestroy({
        mutation: {
            onSuccess: () => {
                redirectTo(baseUrls.missions);
            },
        },
    });
    const redirectToReplace = useRedirectToReplace();

    return (
        <>
            <DisplayIfUserHasPerm
                permissions={[
                    Permissions.MISSION_READ,
                    Permissions.MISSION_WRITE,
                ]}
            >
                <DeleteDialog
                    titleMessage={{
                        ...MESSAGES.deleteMission,
                        values: {
                            missionName: missionName,
                        },
                    }}
                    message={{
                        ...MESSAGES.deleteWarning,
                        values: {
                            name: missionName,
                        },
                    }}
                    onConfirm={() => deleteMission({ id: missionId })}
                    Trigger={DeleteButton}
                    triggerProps={{
                        variant: 'outlined',
                    }}
                />
                <Box sx={{ ml: 2, display: 'inline-block' }}>
                    <EditButton
                        onClick={() =>
                            redirectToReplace(baseUrls.missionsEdit, {
                                id: missionId.toString(),
                            })
                        }
                    />
                </Box>
            </DisplayIfUserHasPerm>
        </>
    );
};
