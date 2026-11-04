import React, { FunctionComponent, useMemo, useState } from 'react';
import Code from '@mui/icons-material/Code';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
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
    // Dialogs are hoisted outside ActionsCell: menu children are unmounted
    // when the menu closes, which would kill any dialog state held inside.
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteDialogKey, setDeleteDialogKey] = useState(0);

    const form = settings.row.original;
    const hasNoVersion = form.latest_form_version === null;
    const shouldShowRestore = shouldShowRestoreAction({
        onlyDeleted,
        showDeleted,
        deletedAt: form.deleted_at,
    });

    // Url to instances
    let urlToInstances = `/${baseUrls.instances}/formIds/${form.id}`;
    if (orgUnitId) {
        urlToInstances = `${urlToInstances}/levels/${orgUnitId}`;
    }
    urlToInstances = `${urlToInstances}/tab/list`;

    // Permissions (same checks as the former DisplayIfUserHasPerm wrappers)
    const canViewInstances = userHasOneOfPermissions(
        [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
        user,
    );
    const canCreateSubmission = userHasPermission(
        Permission.SUBMISSIONS_UPDATE,
        user,
    );
    const canEditForm = userHasPermission(Permission.FORMS, user);
    // If orgUnitId is not undefined, the table is used in the org units details
    // page, which means we shouldn't show form-level actions (create, edit, …)
    const inOrgUnitDetails = Boolean(orgUnitId);

    const latestVersion = form.latest_form_version;

    const actions: TableAction[] = useMemo(
        () => [
            {
                key: 'edit',
                placement: 'inline',
                label: MESSAGES.edit,
                icon: <Settings />,
                url: `/${baseUrls.formDetail}/formId/${form.id}`,
                hidden: inOrgUnitDetails || !canEditForm,
            },
            {
                key: 'viewInstances',
                placement: 'inline',
                label: MESSAGES.viewInstances,
                icon: <FormatListBulleted />,
                url: `${urlToInstances}/isSearchActive/true`,
                hidden: !canViewInstances,
            },
            {
                key: 'createSubmission',
                placement: 'menu',
                label: MESSAGES.instanceCreationDialogTitle,
                icon: <Publish />,
                hidden: inOrgUnitDetails || !canCreateSubmission,
                disabled: hasNoVersion,
                description: hasNoVersion ? MESSAGES.noFormVersion : undefined,
                onClick: () => setIsCreateDialogOpen(true),
            },
            {
                key: 'dhis2Mapping',
                placement: 'menu',
                label: MESSAGES.dhis2Mappings,
                icon: <Hub />,

                url: `/${baseUrls.mappings}/formId/${form.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`,
                color: form.has_mappings ? 'primary.main' : undefined,
                hidden: inOrgUnitDetails || !hasDhis2Module || !canEditForm,
            },
            {
                key: 'download',
                placement: 'menu',
                label: MESSAGES.downloadXLSandXML,
                icon: <Download />,
                hidden: latestVersion === null,
                children: [
                    {
                        key: 'xls',
                        label: 'Excel (XLS)',
                        icon: <TableChart />,
                        url: latestVersion?.xls_file,
                        download: true,
                        reloadDocument: true,
                        hidden: !latestVersion?.xls_file,
                    },
                    {
                        key: 'xml',
                        label: 'XML',
                        icon: <Code />,
                        url: latestVersion?.file,
                        download: true,
                        reloadDocument: true,
                    },
                ],
            },
            { type: 'divider' },
            {
                key: 'delete',
                placement: 'menu',
                label: MESSAGES.delete,
                icon: <Delete />,
                danger: true,
                hidden: inOrgUnitDetails || !canEditForm,
                onClick: () => setDeleteDialogKey(key => key + 1),
            },
        ],
        [
            baseUrls,
            canCreateSubmission,
            canEditForm,
            canViewInstances,
            form,
            hasDhis2Module,
            hasNoVersion,
            inOrgUnitDetails,
            latestVersion,
            urlToInstances,
        ],
    );

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

    // At most 2 icons inline (edit, view instances), the rest in the burger menu
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
                    // Remount with defaultOpen on every menu click
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
