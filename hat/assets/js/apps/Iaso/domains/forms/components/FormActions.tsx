import React, { FunctionComponent, useState } from 'react';
import Code from '@mui/icons-material/Code';
import Delete from '@mui/icons-material/Delete';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import Hub from '@mui/icons-material/Hub';
import Publish from '@mui/icons-material/Publish';
import RestoreFromTrash from '@mui/icons-material/RestoreFromTrash';
import Settings from '@mui/icons-material/Settings';
import TableChart from '@mui/icons-material/TableChart';
import { ActionsCell, TableAction } from 'bluesquare-components';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { createInstance } from '../../instances/actions';
import { CreateReAssignDialogComponent } from '../../instances/components/CreateReAssignDialogComponent';
import { userHasOneOfPermissions, userHasPermission } from '../../users/utils';
import { useRestoreForm } from '../hooks/useRestoreForm';
import MESSAGES from '../messages';

type ShouldShowRestoreActionArgs = {
    onlyDeleted: boolean;
    showDeleted: boolean;
    deletedAt?: string | null;
};

export const shouldShowRestoreAction = ({
    onlyDeleted,
    showDeleted,
    deletedAt,
}: ShouldShowRestoreActionArgs): boolean =>
    onlyDeleted || (showDeleted && Boolean(deletedAt));

type Props = {
    settings: any;
    orgUnitId: number | string;
    baseUrls: any;
    onlyDeleted: boolean;
    showDeleted: boolean;
    hasDhis2Module: boolean;
    deleteForm: (body: { id: number }) => Promise<any>;
};

export const FormActions: FunctionComponent<Props> = ({
    settings,
    orgUnitId,
    baseUrls,
    onlyDeleted,
    showDeleted,
    hasDhis2Module,
    deleteForm,
}) => {
    const user = useCurrentUser();
    const { mutateAsync: restoreForm } = useRestoreForm();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteDialogKey, setDeleteDialogKey] = useState(0);

    const form = settings.row.original;
    const hasNoVersion = form.latest_form_version === null;
    const latestVersion = form.latest_form_version;
    const shouldShowRestore = shouldShowRestoreAction({
        onlyDeleted,
        showDeleted,
        deletedAt: form.deleted_at,
    });
    const inOrgUnitDetails = Boolean(orgUnitId);

    let urlToInstances = `/${baseUrls.instances}/formIds/${form.id}`;
    if (orgUnitId) {
        urlToInstances = `${urlToInstances}/levels/${orgUnitId}`;
    }
    urlToInstances = `${urlToInstances}/tab/list`;

    const canViewInstances = userHasOneOfPermissions(
        [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
        user,
    );
    const canCreateSubmission = userHasPermission(
        Permission.SUBMISSIONS_UPDATE,
        user,
    );
    const canEditForm = userHasPermission(Permission.FORMS, user);

    if (shouldShowRestore) {
        return (
            <ActionsCell
                maxInline={1}
                actions={[
                    {
                        key: 'restore',
                        label: MESSAGES.restoreFormTooltip,
                        icon: <RestoreFromTrash />,
                        onClick: () => restoreForm(form.id),
                    },
                ]}
            />
        );
    }

    const actions: TableAction[] = [
        {
            key: 'edit',
            label: MESSAGES.edit,
            icon: <Settings />,
            href: `/${baseUrls.formDetail}/formId/${form.id}`,
            hidden: inOrgUnitDetails || !canEditForm,
        },
        {
            key: 'viewInstances',
            label: MESSAGES.viewInstances,
            icon: <FormatListBulleted />,
            href: `${urlToInstances}/isSearchActive/true`,
            hidden: !canViewInstances,
        },
        {
            key: 'createSubmission',
            label: MESSAGES.instanceCreationDialogTitle,
            icon: <Publish />,
            menu: true,
            hidden: inOrgUnitDetails || !canCreateSubmission,
            disabled: hasNoVersion,
            tooltip: hasNoVersion ? MESSAGES.noFormVersion : undefined,
            onClick: () => setIsCreateDialogOpen(true),
        },
        {
            key: 'dhis2Mapping',
            label: MESSAGES.dhis2Mappings,
            icon: <Hub />,
            menu: true,
            href: `/${baseUrls.mappings}/formId/${form.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`,
            color: form.has_mappings ? 'primary.main' : undefined,
            hidden: inOrgUnitDetails || !hasDhis2Module || !canEditForm,
        },
        {
            type: 'section',
            label: MESSAGES.downloadXLSandXML,
            hidden: latestVersion === null,
        },
        {
            key: 'xls',
            label: 'Excel (XLS)',
            icon: <TableChart />,
            href: latestVersion?.xls_file,
            download: true,
            menu: true,
            hidden: !latestVersion?.xls_file,
        },
        {
            key: 'xml',
            label: 'XML',
            icon: <Code />,
            href: latestVersion?.file,
            download: true,
            menu: true,
            hidden: latestVersion === null,
        },
        { type: 'divider' },
        {
            key: 'delete',
            label: MESSAGES.delete,
            icon: <Delete />,
            menu: true,
            color: 'error.main',
            hidden: inOrgUnitDetails || !canEditForm,
            onClick: () => setDeleteDialogKey(key => key + 1),
        },
    ];

    return (
        <>
            <ActionsCell actions={actions} maxInline={2} />
            {isCreateDialogOpen && (
                <CreateReAssignDialogComponent
                    titleMessage={MESSAGES.instanceCreationDialogTitle}
                    confirmMessage={MESSAGES.ok}
                    cancelMessage={MESSAGES.cancel}
                    formType={{
                        id: form.id,
                        periodType: form.period_type,
                        orgUnitTypeIds: [],
                    }}
                    onCreateOrReAssign={currentForm =>
                        createInstance(currentForm)
                    }
                    orgUnitTypes={form.org_unit_type_ids}
                    isOpen={isCreateDialogOpen}
                    closeDialog={() => setIsCreateDialogOpen(false)}
                />
            )}
            {deleteDialogKey > 0 && (
                <DeleteDialog
                    key={deleteDialogKey}
                    defaultOpen
                    titleMessage={MESSAGES.deleteFormTitle}
                    onConfirm={() => {
                        deleteForm({ id: form.id });
                    }}
                    Trigger={() => <></>}
                />
            )}
        </>
    );
};
