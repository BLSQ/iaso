/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { useDropzone } from 'react-dropzone';
// @ts-ignore
import { IconButton, useSafeIntl } from 'bluesquare-components';
import AttachmentIcon from '@material-ui/icons/Attachment';
import { Box } from '@material-ui/core';
import MESSAGES from './messages';
import { CustomInput, useCustomInputTextStyle } from './CustomInput';

type Props = {
    multi?: boolean;
    // eslint-disable-next-line no-unused-vars
    onFilesSelect: (files: File[]) => void;
    files: File[];
    placeholder?: string;
};

const Icon = (
    <IconButton
        size="small"
        tooltipMessage={MESSAGES.clickOrDragFile}
        overrideIcon={AttachmentIcon}
        onClick={() => null}
    />
);
export const FilesUpload: FunctionComponent<Props> = ({
    placeholder,
    multi = true,
    onFilesSelect = () => null,
    files = [],
}) => {
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: onFilesSelect,
        multiple: multi,
    });
    const { formatMessage } = useSafeIntl();
    const placeHolderText = placeholder ?? formatMessage(MESSAGES.files);

    const contentStyle = useCustomInputTextStyle();

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            <CustomInput placeholder={placeHolderText} icon={Icon}>
                {files.length > 0 && (
                    <Box className={contentStyle.textStyle}>
                        {`${files.length} files selected`}
                    </Box>
                )}
            </CustomInput>
        </div>
    );
};
