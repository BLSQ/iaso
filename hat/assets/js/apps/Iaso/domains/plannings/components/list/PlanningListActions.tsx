import React, { FunctionComponent, useState } from 'react';
import Assignment from '@mui/icons-material/Assignment';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import {
    IconButton as IconButtonComponent,
    Setting,
    ActionsCell,
} from 'bluesquare-components';
import moment from 'moment';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';
import { Planning } from '../../types';
import { canAssignPlanning, getAssignmentsUrl } from '../../utils';

interface PlanningListActionsProps extends Setting<Planning> {
    deletePlanning: (id: number) => void;
}

export const PlanningListActions: FunctionComponent<
    PlanningListActionsProps
> = ({ row: { original: planning }, deletePlanning }) => {
    const canAssign = canAssignPlanning(planning);
    const user = useCurrentUser();

    const canEditPlanning = userHasPermission(PLANNING_WRITE, user);
    const [deleteDialogKey, setDeleteDialogKey] = useState(0);

    const hasStarted = Boolean(
        planning.started_at &&
        moment().isAfter(moment(planning.started_at, 'DD/MM/YYYY'), 'day'),
    );
    const cannotDelete = Boolean(planning.published_at || hasStarted);

    const actions = [
        {
            key: 'edit',
            label: MESSAGES.editPlanning,
            icon: <Edit />,
            hidden: !canEditPlanning,
            href: `/${baseUrls.planningDetails}/planningId/${planning.id}/mode/edit`,
        },
        {
            key: 'assignments',
            label: MESSAGES.assignments,
            icon: <Assignment />,
            href: getAssignmentsUrl(planning.id),
            disabled: !canAssign,
        },
        {
            key: 'copy',
            label: MESSAGES.duplicatePlanning,
            icon: <FileCopyIcon />,
            hidden: !canEditPlanning,
            href: `/${baseUrls.planningDetails}/planningId/${planning.id}/mode/copy`,
        },
        {
            key: 'delete',
            label: MESSAGES.delete,
            icon: <Delete />,
            menu: true,
            color: 'error.main',
            disabled: cannotDelete,
            hidden: !canEditPlanning,
            onClick: () => setDeleteDialogKey(key => key + 1),
        },
    ];

    if (planning.deprecated) {
        return (
            <IconButtonComponent
                url={`/${baseUrls.planningDetails}/planningId/${planning.id}/mode/edit`}
                tooltipMessage={MESSAGES.viewDetails}
                icon="remove-red-eye"
                size="small"
            />
        );
    }
    return (
        <>
            <ActionsCell actions={actions} maxInline={2} />
            {deleteDialogKey > 0 && (
                <DeleteDialog
                    key={deleteDialogKey}
                    defaultOpen
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
                    onConfirm={() => deletePlanning(planning.id)}
                    keyName="delete-planning"
                    Trigger={() => <></>}
                />
            )}
        </>
    );
};
