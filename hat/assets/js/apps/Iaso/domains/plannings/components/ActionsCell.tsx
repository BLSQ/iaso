import React, { FunctionComponent } from 'react';
import { Assignment } from '@mui/icons-material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import { ColumnCell } from 'Iaso/types/general';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import { useDeletePlanning } from '../hooks/requests/useDeletePlanning';
import MESSAGES from '../messages';

const getAssignmentUrl = (planning: Planning): string => {
    return `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
};
export const ActionsCell: FunctionComponent<ColumnCell<Planning>> = ({
    row: { original: planning },
}) => {
    const { mutateAsync: deletePlanning } = useDeletePlanning();
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
                url={getAssignmentUrl(planning)}
                tooltipMessage={MESSAGES.viewPlanning}
                size="small"
                replace={false}
                overrideIcon={Assignment}
            />
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <IconButtonComponent
                    url={`/${baseUrls.planningDetails}/planningId/${planning.id}/mode/copy`}
                    tooltipMessage={MESSAGES.editPlanning}
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
