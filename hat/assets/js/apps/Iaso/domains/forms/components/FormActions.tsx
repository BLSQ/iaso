import React, { FunctionComponent, useState } from 'react';
import { Download } from '@mui/icons-material';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import { Menu, MenuItem } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import { Link } from 'react-router-dom';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import * as Permission from '../../../utils/permissions';
import { createInstance } from '../../instances/actions';
import { useDeleteForm } from '../hooks/useDeleteForm';
import { useRestoreForm } from '../hooks/useRestoreForm';
import MESSAGES from '../messages';
import { CreateSubmissionModal } from './CreateSubmissionModal/CreateSubmissionModal';

type Props = {
    settings: any;
    orgUnitId: number | string;
    baseUrls: any;
    showDeleted: boolean;
};

export const FormActions: FunctionComponent<Props> = ({
    settings,
    orgUnitId,
    baseUrls,
    showDeleted,
}) => {
    // XLS and XML download states and functions
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    // Url to instances
    let urlToInstances = `/${baseUrls.instances}/formIds/${settings.row.original.id}/isSearchActive/true`;
    if (orgUnitId) {
        urlToInstances = `${urlToInstances}/levels/${orgUnitId}`;
    }
    urlToInstances = `${urlToInstances}/tab/list`;
    // Restore and delete form's hooks
    const { mutateAsync: restoreForm } = useRestoreForm();
    const { mutateAsync: deleteForm } = useDeleteForm();

    return (
        <section>
            {showDeleted && (
                <IconButton
                    onClick={() => restoreForm(settings.row.original.id)}
                    icon="restore-from-trash"
                    tooltipMessage={MESSAGES.restoreFormTooltip}
                />
            )}
            {!showDeleted && (
                <>
                    <DisplayIfUserHasPerm
                        permissions={[
                            Permission.SUBMISSIONS,
                            Permission.SUBMISSIONS_UPDATE,
                        ]}
                    >
                        <IconButton
                            url={`${urlToInstances}`}
                            tooltipMessage={MESSAGES.viewInstances}
                            overrideIcon={FormatListBulleted}
                        />
                    </DisplayIfUserHasPerm>
                    {/* If orgUnitId is not undefined, it means the btable is used in the org units details page,
                                    which, in turn, means we shouldn't show the button to create a submission */}
                    {!orgUnitId && (
                        <>
                            <DisplayIfUserHasPerm
                                permissions={[Permission.SUBMISSIONS_UPDATE]}
                            >
                                <CreateSubmissionModal
                                    titleMessage={
                                        MESSAGES.instanceCreationDialogTitle
                                    }
                                    confirmMessage={MESSAGES.ok}
                                    cancelMessage={MESSAGES.cancel}
                                    formType={{
                                        id: settings.row.original.id,
                                        periodType:
                                            settings.row.original.period_type,
                                    }}
                                    onCreateOrReAssign={(
                                        currentForm,
                                        payload,
                                    ) => createInstance(currentForm, payload)}
                                    orgUnitTypes={
                                        settings.row.original.org_unit_type_ids
                                    }
                                    iconProps={{}}
                                />
                            </DisplayIfUserHasPerm>

                            <DisplayIfUserHasPerm
                                permissions={[Permission.FORMS]}
                            >
                                <IconButton
                                    url={`/${baseUrls.formDetail}/formId/${settings.row.original.id}`}
                                    icon="edit"
                                    tooltipMessage={MESSAGES.edit}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[Permission.FORMS]}
                            >
                                <IconButton
                                    // eslint-disable-next-line max-len
                                    url={`/${baseUrls.mappings}/formId/${settings.row.original.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
                                    icon="dhis"
                                    tooltipMessage={MESSAGES.dhis2Mappings}
                                    color={
                                        settings.row.original.has_mappings
                                            ? 'primary'
                                            : undefined
                                    }
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[Permission.FORMS]}
                            >
                                <DeleteDialog
                                    titleMessage={MESSAGES.deleteFormTitle}
                                    onConfirm={closeDialog =>
                                        deleteForm(
                                            settings.row.original.id,
                                        ).then(closeDialog)
                                    }
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    )}
                </>
            )}
            {settings.row.original.latest_form_version !== null && (
                <>
                    <IconButton
                        onClick={handleClick as () => void}
                        overrideIcon={Download}
                        tooltipMessage={MESSAGES.downloadXLSandXML}
                    />

                    <Menu
                        id="basic-menu"
                        open={open}
                        onClose={handleClose}
                        anchorEl={anchorEl}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        {settings.row.original.latest_form_version.xls_file && (
                            <MenuItem onClick={handleClose}>
                                <Link
                                    download
                                    reloadDocument
                                    to={
                                        settings.row.original
                                            .latest_form_version.xls_file
                                    }
                                >
                                    XLS
                                </Link>
                            </MenuItem>
                        )}
                        <MenuItem onClick={handleClose}>
                            <Link
                                download
                                reloadDocument
                                to={
                                    settings.row.original.latest_form_version
                                        .file
                                }
                            >
                                XML
                            </Link>
                        </MenuItem>
                    </Menu>
                </>
            )}
        </section>
    );
};
