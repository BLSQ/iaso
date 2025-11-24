import React, { FunctionComponent } from 'react';
import { Assignment } from '@mui/icons-material';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import { ColumnCell } from 'Iaso/types/general';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import { useDeletePlanning } from '../hooks/requests/useDeletePlanning';
import MESSAGES from '../messages';
import { DuplicatePlanning, EditPlanning } from './PlanningDialog';

const getAssignmentUrl = (planning: Planning): string => {
    return `/${baseUrls.assignments}/planningId/${planning.id}/team/${planning.team}`;
};
export const ActionsCell: FunctionComponent<ColumnCell<Planning>> = ({
    row: { original: planning },
}) => {
    const { mutateAsync: deletePlanning } = useDeletePlanning();
    return (
        // TODO: limit to user permissions
        <>
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <EditPlanning type="edit" iconProps={{}} planning={planning} />
            </DisplayIfUserHasPerm>
            <IconButtonComponent
                url={getAssignmentUrl(planning)}
                tooltipMessage={MESSAGES.viewPlanning}
                size="small"
                replace={false}
                overrideIcon={Assignment}
            />
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <DuplicatePlanning
                    iconProps={{}}
                    type="copy"
                    planning={planning}
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
