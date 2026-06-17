import React, { FunctionComponent } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { DialogContentText } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useBoundState } from 'Iaso/hooks/useBoundState';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { bulkDelete } from '../actions';
import MESSAGES from '../messages';

type Props = {
    selection: { selectCount: number; filters?: any };
    filters: Record<string, any>;
    setForceRefresh: () => void;
    resetSelection: () => void;
    isUnDeleteAction: boolean;
};

const DeleteInstanceDialog: FunctionComponent<Props> = ({
    selection = {
        selectCount: 0,
        filters: undefined,
    },
    filters,
    setForceRefresh,
    resetSelection,
    isUnDeleteAction,
}) => {
    const [allowConfirm, setAllowConfirm] = useBoundState(
        false,
        Boolean(selection?.selectCount),
    );

    const onConfirm = closeDialog => {
        setAllowConfirm(false);
        bulkDelete(selection, filters, isUnDeleteAction, () => {
            closeDialog();
            resetSelection();
            setForceRefresh();
        });
    };

    const renderTrigger = ({ openDialog }) => {
        const disabled = selection.selectCount === 0;
        const Icon = isUnDeleteAction ? RestoreFromTrashIcon : DeleteIcon;

        return (
            <Icon
                color={disabled ? 'disabled' : 'inherit'}
                onClick={
                    disabled
                        ? undefined
                        : event => {
                              event.stopPropagation();
                              openDialog();
                          }
                }
            />
        );
    };
    const titleMessage = isUnDeleteAction
        ? MESSAGES.unDeleteInstanceCount
        : MESSAGES.deleteInstanceCount;
    return (
        <ConfirmCancelDialogComponent
            titleMessage={{
                ...titleMessage,
                values: {
                    count: selection.selectCount,
                },
            }}
            onConfirm={onConfirm}
            renderTrigger={renderTrigger}
            allowConfirm={allowConfirm}
        >
            <DialogContentText id="alert-dialog-description">
                <FormattedMessage {...MESSAGES.deleteInstanceWarning} />
            </DialogContentText>
        </ConfirmCancelDialogComponent>
    );
};

export default DeleteInstanceDialog;
