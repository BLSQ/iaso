import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { DialogContentText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { bulkDelete } from '../actions';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import MESSAGES from '../messages';

const useStyles = makeStyles(() => ({
    iconDisabled: {
        opacity: 0.3,
        cursor: 'not-allowed',
    },
}));

const DeleteInstanceDialog = ({
    selection,
    filters,
    setForceRefresh,
    resetSelection,
    isUnDeleteAction,
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const [allowConfirm, setAllowConfirm] = useState(true);
    const onConfirm = closeDialog => {
        setAllowConfirm(false);
        dispatch(
            bulkDelete(selection, filters, isUnDeleteAction, () => {
                closeDialog();
                resetSelection();
                setForceRefresh();
                setAllowConfirm(false);
            }),
        );
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

DeleteInstanceDialog.defaultProps = {
    selection: {
        selectCount: 0,
        filters: undefined,
    },
};
DeleteInstanceDialog.propTypes = {
    selection: PropTypes.object,
    filters: PropTypes.object.isRequired,
    setForceRefresh: PropTypes.func.isRequired,
    resetSelection: PropTypes.func.isRequired,
    isUnDeleteAction: PropTypes.bool.isRequired,
};

export default DeleteInstanceDialog;
