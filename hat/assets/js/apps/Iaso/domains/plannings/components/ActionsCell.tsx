import React, { FunctionComponent } from 'react';
import { Assignment } from '@mui/icons-material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { ColumnCell } from 'Iaso/types/general';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import MESSAGES from '../messages';
import { Planning } from '../types';

interface ActionsCellProps extends ColumnCell<Planning> {
    deletePlanning: (id: number) => void;
}
export const ActionsCell: FunctionComponent<ActionsCellProps> = ({
    row: { original: planning },
    deletePlanning,
}) => {
    const canAssign =
        Boolean(planning.selected_sampling_results) &&
        Boolean(planning.published_at);
    return (
        <>
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <IconButtonComponent
                    url={`/${baseUrls.planningDetails}/planningId/${planning.id}/mode/edit`}
                    tooltipMessage={MESSAGES.editPlanning}
                    icon="edit"
                    size="small"
                />
            </DisplayIfUserHasPerm>
            <IconButtonComponent
                url={`/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`}
                tooltipMessage={MESSAGES.viewPlanning}
                size="small"
                replace={false}
                overrideIcon={Assignment}
                disabled={!canAssign}
            />
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <IconButtonComponent
                    url={`/${baseUrls.planningDetails}/planningId/${planning.id}/mode/copy`}
                    tooltipMessage={MESSAGES.duplicatePlanning}
                    overrideIcon={FileCopyIcon}
                    size="small"
                />
            </DisplayIfUserHasPerm>
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <DeleteDialog
                    titleMessage={{
                        ...MESSAGES.deletePlanning,
                        values: {
                            planningName: planning.name,
                        },
                    }}
                    message={{
                        ...MESSAGES.deleteWarning,
                        values: {
                            name: planning.name,
                        },
                    }}
                    disabled={false}
                    onConfirm={() => deletePlanning(planning.id)}
                    keyName="delete-planning"
                />
            </DisplayIfUserHasPerm>
        </>
    );
};
