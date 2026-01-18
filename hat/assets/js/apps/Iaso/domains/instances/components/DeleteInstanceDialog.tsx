import React, { useState, FunctionComponent } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { DialogContentText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormattedMessage } from 'react-intl';
import { bulkDelete } from '../actions';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';

const useStyles = makeStyles(() => ({
    iconDisabled: {
        opacity: 0.3,
        cursor: 'not-allowed',
    },
}));

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
    const classes = useStyles();
    const [allowConfirm, setAllowConfirm] = useState(true);
    const onConfirm = closeDialog => {
        setAllowConfirm(false);
        bulkDelete(selection, filters, isUnDeleteAction, () => {
            closeDialog();
            resetSelection();
            setForceRefresh();
            setAllowConfirm(false);
        });
    };

    const renderTrigger = ({ openDialog }) => {
        const iconProps = {
            className:
                selection.selectCount === 0 ? classes.iconDisabled : null,
            onClick: selection.selectCount > 0 ? openDialog : () => null,
            disabled: selection.selectCount === 0,
        };
        if (isUnDeleteAction) {
            return <RestoreFromTrashIcon {...iconProps} />;
        }
        return <DeleteIcon {...iconProps} />;
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
