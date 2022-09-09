/* eslint-disable react/jsx-props-no-spreading */
import React, { ComponentType, FunctionComponent, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { DropzoneOptions, DropzoneState, useDropzone } from 'react-dropzone';
// @ts-ignore
// import { IconButton as IconButtonComponent } from 'bluesquare-components';
// import {
//     ConfirmCancelModal,
//     ConfirmCancelModalProps,
// } from './ConfirmCancelModal';

const styles = theme => ({
    cssGridContainer: {
        display: 'grid',
    },

    layer: {
        gridColumn: 1,
        gridRow: 1,
    },
    test: { border: '2px solid red', backgroundColor: 'red', zIndex: 9999 },
    visible: { visibility: 'visible' },
    hidden: { visibility: 'hidden' },
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

type Props<T extends ComponentProps> = T & {
    multi?: boolean; // eslint-disable-next-line no-unused-vars
};

export type UsableDropzoneState = Omit<
    DropzoneState,
    'getRootProps' | 'getInputProps'
>;

// TODO rename and export
type ComponentProps = UsableDropzoneState & {
    selectedFiles: File[];
};

export const makeModalWithDnDField =
    <T extends ComponentProps>(
        Component: ComponentType<T>,
    ): FunctionComponent<Props<T>> =>
    (props: Props<T>) => {
        const { multi = true, ...rest } = props;
        const classes = useStyles();
        const [showDropZone, setShowDropzone] = useState<boolean>(false);
        const [selectedFiles, setSelectedFiles] = useState<File | File[]>([]);
        const { getRootProps, getInputProps, ...dropZoneProps } = useDropzone({
            // onDrop: onFilesSelect,
            noClick: true,
            autoFocus: false,
            onDrop: (files: File[]) => {
                setSelectedFiles(files);
            },
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
            onDragOver: () => {
                setShowDropzone(true);
            },
        });
        const showChildren = showDropZone ? classes.hidden : classes.visible;
        const showOverlay = showDropZone ? classes.visible : classes.hidden;
        return (
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className={classes.cssGridContainer}>
                    <div className={`${classes.layer} ${showChildren}`}>
                        <Component
                            {...({
                                ...rest,
                                ...dropZoneProps,
                                selectedFiles,
                            } as unknown as T)}
                        />
                    </div>
                    <div
                        className={`${classes.layer} ${showOverlay} ${classes.test}`}
                    />
                </div>
            </div>
        );
    };
