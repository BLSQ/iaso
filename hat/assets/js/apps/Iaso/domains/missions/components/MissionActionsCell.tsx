import React, { FunctionComponent } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { ColumnCell } from 'Iaso/types/general';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import { CreateEditMissionDialog } from './CreateEditMissionDialog';
import MESSAGES from '../messages';
import { Mission } from '../types';

interface MissionActionsCellProps extends ColumnCell<Mission> {
    deleteMission: (id: number) => void;
}

export const MissionActionsCell: FunctionComponent<MissionActionsCellProps> = ({
    row: { original: mission },
    deleteMission,
}) => {
    return (
        <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
            <CreateEditMissionDialog
                mission={mission}
                renderTrigger={({ openDialog }) => (
                    <IconButtonComponent
                        onClick={openDialog}
                        icon="edit"
                        tooltipMessage={MESSAGES.editMission}
                        size="small"
                    />
                )}
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
                onConfirm={() => deleteMission(mission.id)}
                keyName="delete-mission"
            />
        </DisplayIfUserHasPerm>
    );
};
