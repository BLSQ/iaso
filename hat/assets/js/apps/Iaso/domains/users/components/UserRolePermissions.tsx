import { Stack, Typography } from '@mui/material';
import React, { FunctionComponent } from 'react';
import {
    CheckCircleOutlineOutlined as CheckedIcon,
    HighlightOffOutlined as NotCheckedIcon,
} from '@mui/icons-material';
import { useSafeIntl } from 'bluesquare-components';
import PERMISSIONS_MESSAGES from '../permissionsMessages';
import { Permission } from '../../userRoles/types/userRoles';

type Props = {
    original: any;
    userRolepermissions: (string | Permission)[];
};
export const UserRolePermissions: FunctionComponent<Props> = ({
    original,
    userRolepermissions,
}) => {
    const { formatMessage } = useSafeIntl();
    if (original.readEdit) {
        const permissions: [string, string][] = Object.entries(
            original.readEdit,
        );
        return (
            <span
                style={{
                    display: 'inline-flex',
                    gap: '5px',
                }}
            >
                {permissions.map(([key, value]) => {
                    const hasPermission = userRolepermissions.includes(value);
                    return (
                        <Stack
                            key={key}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >
                            {hasPermission ? (
                                <CheckedIcon
                                    style={{
                                        color: 'green',
                                    }}
                                />
                            ) : (
                                <NotCheckedIcon color="disabled" />
                            )}
                            <Typography variant="body1">
                                {formatMessage(PERMISSIONS_MESSAGES[key])}
                            </Typography>
                        </Stack>
                    );
                })}
            </span>
        );
    }

    const hasPermission = userRolepermissions.includes(
        original.permissionCodeName,
    );

    return hasPermission ? (
        <CheckedIcon style={{ color: 'green' }} />
    ) : (
        <NotCheckedIcon color="disabled" />
    );
};
