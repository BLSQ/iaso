import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import {
    PaginatedMissionPolymorphicListList,
    useApiMicroplanningMissionsDestroy,
} from 'Iaso/api/missions';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { ColumnCell } from 'Iaso/types/general';
import { MISSION_READ, MISSION_WRITE } from 'Iaso/utils/permissions';
import MESSAGES from '../messages';

type MissionActionsCellProps = ColumnCell<
    NonNullable<PaginatedMissionPolymorphicListList['results']>[number]
>;

export const MissionActionsCell: FunctionComponent<MissionActionsCellProps> = ({
    row: { original: mission },
}) => {
    const { mutateAsync: deleteMission } = useApiMicroplanningMissionsDestroy();
    return (
        <>
            <DisplayIfUserHasPerm permissions={[MISSION_READ]}>
                <IconButton
                    tooltipMessage={MESSAGES.view}
                    icon="remove-red-eye"
                    url={`/${baseUrls.missionsDetails}/id/${mission.id}/`}
                />
            </DisplayIfUserHasPerm>
            <DisplayIfUserHasPerm
                permissions={[MISSION_READ, MISSION_WRITE]}
                strict
            >
                <IconButton
                    tooltipMessage={MESSAGES.edit}
                    icon="edit"
                    url={`/${baseUrls.missionsEdit}/id/${mission.id}/`}
                    aria-label={MESSAGES.edit}
                />
                <DeleteDialog
                    titleMessage={{
                        ...MESSAGES.deleteMission,
                        values: {
                            missionName: mission.name,
                        },
                    }}
                    message={{
                        ...MESSAGES.deleteWarning,
                        values: {
                            name: mission.name,
                        },
                    }}
                    onConfirm={() => deleteMission({ id: mission.id })}
                    keyName="delete-mission"
                />
            </DisplayIfUserHasPerm>
        </>
    );
};
