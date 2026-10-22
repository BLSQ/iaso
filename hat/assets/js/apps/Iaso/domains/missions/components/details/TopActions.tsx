import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { LinkButton, useRedirectTo } from 'bluesquare-components';
import { useSafeIntl } from 'bluesquare-components';
import { useApiMicroplanningMissionsDestroy } from 'Iaso/api/missions';
import { DeleteButton } from 'Iaso/components/Buttons/DeleteButton';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { mutateAsync: deleteMission } = useApiMicroplanningMissionsDestroy({
        mutation: {
            onSuccess: () => {
                redirectTo(baseUrls.missions);
            },
        },
    });

    const { formatMessage } = useSafeIntl();

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
                        size: isMobile ? 'small' : 'medium',
                    }}
                />
                <Box sx={{ ml: 2, display: 'inline-block' }}>
                    <LinkButton
                        to={`/${baseUrls.missionsEdit}/id/${missionId}/`}
                        variant="outlined"
                        color="primary"
                        size={isMobile ? 'small' : 'medium'}
                    >
                        {formatMessage(MESSAGES.edit)}
                    </LinkButton>
                </Box>
            </DisplayIfUserHasPerm>
        </>
    );
};
