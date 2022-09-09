import React, { FunctionComponent } from 'react';
// @ts-ignore
import { IconButton, useSafeIntl } from 'bluesquare-components';
import AttachmentIcon from '@material-ui/icons/Attachment';
import { Box } from '@material-ui/core';
import MESSAGES from './messages';
import { CustomInput, useCustomInputTextStyle } from './CustomInput';

type Props = {
    files: File[];
    placeholder?: string;
    onClick?: () => void;
};

const Icon = (
    <IconButton
        size="small"
        tooltipMessage={MESSAGES.clickOrDragFile}
        overrideIcon={AttachmentIcon}
        onClick={() => null}
    />
);

export const FilesUploadnoState: FunctionComponent<Props> = ({
    placeholder,
    files = [],
    onClick = () => null,
}) => {
    const { formatMessage } = useSafeIntl();
    const placeHolderText = placeholder ?? formatMessage(MESSAGES.files);

    const contentStyle = useCustomInputTextStyle();

    return (
        <>
            <CustomInput
                placeholder={placeHolderText}
                icon={Icon}
                onClick={onClick}
            >
                {files.length > 0 && (
                    <Box className={contentStyle.textStyle}>
                        {`${files.length} files selected`}
                    </Box>
                )}
            </CustomInput>
        </>
    );
};
