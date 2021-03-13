import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { DialogContentText, makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
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
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const onConfirm = closeDialog => {
        dispatch(
            bulkDelete(selection, filters, () => {
                closeDialog();
                resetSelection();
                setForceRefresh();
            }),
        );
    };
    return (
        <ConfirmCancelDialogComponent
            titleMessage={{
                ...MESSAGES.deleteInstanceCount,
                values: {
                    count: selection.selectCount,
                },
            }}
            onConfirm={onConfirm}
            renderTrigger={({ openDialog }) => (
                <DeleteIcon
                    className={
                        selection.selectCount === 0
                            ? classes.iconDisabled
                            : null
                    }
                    onClick={
                        selection.selectCount > 0 ? openDialog : () => null
                    }
                    disabled={selection.selectCount === 0}
                />
            )}
        >
            <DialogContentText id="alert-dialog-description">
                <FormattedMessage {...MESSAGES.deleteWarning} />
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
};

export default DeleteInstanceDialog;
