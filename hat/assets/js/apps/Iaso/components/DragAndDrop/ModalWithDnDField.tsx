/* eslint-disable react/jsx-props-no-spreading */
import { makeStyles } from '@material-ui/styles';
import React, { FunctionComponent, ReactNode, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ConfirmCancelModal,
    ConfirmCancelModalProps,
} from './ConfirmCancelModal';

const styles = theme => ({
    cssGridContainer: {
        display: 'grid',
    },

    layer: {
        gridColumn: 1,
        gridRow: 1,
    },
    visible: { visibility: 'visible' },
    hidden: { visibilioty: 'hidden' },
    outlined: {
        border: `2px dashed ${theme.palette.mediumGray.main}`,
        backgroundColor: theme.palette.ligthGray.main,
    },
    text: {
        color: theme.palette.mediumGray.main,
    },
});
// @ts-ignore
const useStyles = makeStyles(styles);

type Props = ConfirmCancelModalProps & {
    children: ReactNode;
    multi?: boolean; // eslint-disable-next-line no-unused-vars
    onFilesSelect: (files: File[]) => void;
};

export const ModalWithDnDField: FunctionComponent<Props> = ({
    open = false,
    maxWidth = 'sm',
    onClose,
    id,
    dataTestId,
    titleMessage,
    children,
    closeDialog: closeDialogProp,
    allowConfirm = true,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
    additionalButton = false,
    additionalMessage,
    onAdditionalButtonClick,
    allowConfirmAdditionalButton = true,
    multi = true,
    onFilesSelect,
}) => {
    const classes = useStyles();
    const [showDropZone, setShowDropzone] = useState<boolean>(false);
    const showChildren = showDropZone ? classes.hidden : classes.visible;
    const showOverlay = showDropZone ? classes.visible : classes.hidden;
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: onFilesSelect,
        multiple: multi,
        onDragLeave: () => {
            setShowDropzone(false);
        },
        onDragEnter: () => {
            setShowDropzone(true);
        },
        onDropAccepted: () => {
            setShowDropzone(false);
        },
    });
    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            <ConfirmCancelModal
                open={open}
                maxWidth={maxWidth}
                onClose={onClose}
                id={id}
                dataTestId={dataTestId}
                titleMessage={titleMessage}
                closeDialog={closeDialogProp}
                allowConfirm={allowConfirm}
                onConfirm={onConfirm}
                confirmMessage={confirmMessage}
                onCancel={onCancel}
                cancelMessage={cancelMessage}
                additionalButton={additionalButton}
                additionalMessage={additionalMessage}
                onAdditionalButtonClick={onAdditionalButtonClick}
                allowConfirmAdditionalButton={allowConfirmAdditionalButton}
            >
                <div className={classes.cssGridContainer}>
                    <div className={`${classes.layer} ${showChildren}`}>
                        {children}
                    </div>
                    <div className={`${classes.layer}r ${showOverlay}`} />
                </div>
            </ConfirmCancelModal>
        </div>
    );
};
