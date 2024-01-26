import React, { FunctionComponent } from 'react';

import { Paper, Box } from '@mui/material';

import AttachFile from '@mui/icons-material/AttachFile';

import {
    displayDateFromTimestamp,
    PdfSvg,
    TextSvg,
    WordSvg,
    ExcellSvg,
    CsvSvg,
} from 'bluesquare-components';
import { getFileName } from '../../utils/filesUtils';
import { ShortFile } from '../../domains/instances/types/instance';

const styles = {
    paper: {
        width: '100%',
        height: 120,
        padding: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        justifyItem: 'center',
        flexDirection: 'column',
        cursor: 'pointer',
    },
    link: {
        textDecoration: 'none !important',
        fontSize: 10,
    },
    icon: {
        width: 65,
        height: 'auto',
        display: 'block',
    },
    muiIcon: {
        width: 50,
        margin: 1,
        height: 'auto',
        display: 'block',
    },
    fileInfo: {
        textAlign: 'center',
        display: 'block',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
        height: '20px',
        whiteSpace: 'nowrap',
    },
};
type IconProps = {
    fileExtension: string;
};

const ExtensionIcon: FunctionComponent<IconProps> = ({ fileExtension }) => {
    switch (fileExtension) {
        case 'pdf':
            return <PdfSvg color="secondary" sx={styles.icon} />;
        case 'csv':
            return <CsvSvg color="secondary" sx={styles.icon} />;
        case 'doc':
        case 'docx':
            return <WordSvg color="secondary" sx={styles.icon} />;
        case 'xls':
        case 'xlsx':
            return <ExcellSvg color="secondary" sx={styles.icon} />;
        case 'txt':
            return <TextSvg color="secondary" sx={styles.icon} />;
        default:
            return <AttachFile color="secondary" sx={styles.muiIcon} />;
    }
};

type Props = {
    file: ShortFile;
};

const DocumentsItemComponent: FunctionComponent<Props> = ({ file }) => {
    const fileName = getFileName(file.path);
    return (
        <Box
            component="a"
            href={file.path}
            target="_blank"
            sx={styles.link}
            rel="noreferrer"
        >
            <Paper sx={styles.paper}>
                <ExtensionIcon fileExtension={fileName.extension} />
                <Box sx={styles.fileInfo}>
                    {displayDateFromTimestamp(file.createdAt)}
                </Box>
                <Box sx={styles.fileInfo}>
                    {`${fileName.name}.${fileName.extension}`}
                </Box>
            </Paper>
        </Box>
    );
};

export default DocumentsItemComponent;
