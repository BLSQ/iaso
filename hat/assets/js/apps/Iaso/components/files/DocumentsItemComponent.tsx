import React, { FunctionComponent } from 'react';

import AttachFile from '@mui/icons-material/AttachFile';
import { Paper, Box } from '@mui/material';

import {
    PdfSvg,
    TextSvg,
    WordSvg,
    ExcellSvg,
    CsvSvg,
} from 'bluesquare-components';
import { getFileName } from 'Iaso/utils/filesUtils';
import { PdfPreview } from './pdf/PdfPreview';

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
        height: '35px',
        whiteSpace: 'nowrap',
        fontSize: 10,
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
    filePath: string;
    fileInfo?: string;
    getDisplayName?: (filePath: string) => React.ReactNode;
    url?: string;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    getInfos?: (filePath: string) => React.ReactNode;
    getExtraInfos?: (filePath: string) => React.ReactNode;
};

type PdfItemProps = {
    filePath: string;
    getDisplayName?: (filePath: string) => React.ReactNode;
    url?: string;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    getInfos?: (filePath: string) => React.ReactNode;
    getExtraInfos?: (filePath: string) => React.ReactNode;
};
export const OpenButtonComponent = ({ onClick, disabled, ...buttonProps }) => (
    <Box
        role="button"
        onClick={disabled ? undefined : onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
        }}
    >
        <Paper sx={styles.paper}>
            <PdfSvg color="secondary" sx={styles.icon} />
            <Box sx={styles.fileInfo}>{buttonProps.label}</Box>
        </Paper>
    </Box>
);

const PdfItem: FunctionComponent<PdfItemProps> = ({
    filePath,
    getDisplayName = filePath => {
        const fileName = getFileName(filePath);
        return `${fileName.name}.${fileName.extension}`;
    },
    url = undefined,
    urlLabel = undefined,
    getInfos = () => null,
    getExtraInfos = () => null,
}) => {
    return (
        <PdfPreview
            pdfUrl={filePath}
            OpenButtonComponent={OpenButtonComponent}
            buttonProps={{
                label: getDisplayName(filePath),
            }}
            url={url}
            urlLabel={urlLabel}
            getInfos={getInfos}
            getExtraInfos={getExtraInfos}
        />
    );
};

const DocumentsItemComponent: FunctionComponent<Props> = ({
    filePath,
    fileInfo,
    getDisplayName = filePath => {
        const fileName = getFileName(filePath);
        return `${fileName.name}.${fileName.extension}`;
    },
    url = undefined,
    urlLabel = undefined,
    getInfos = () => null,
    getExtraInfos = () => null,
}) => {
    const fileName = getFileName(filePath);
    if (fileName.extension === 'pdf') {
        return (
            <PdfItem
                filePath={filePath}
                getDisplayName={getDisplayName}
                url={url}
                urlLabel={urlLabel}
                getInfos={getInfos}
                getExtraInfos={getExtraInfos}
            />
        );
    }
    return (
        <Box
            component="a"
            href={filePath}
            target="_blank"
            sx={styles.link}
            rel="noreferrer"
        >
            <Paper sx={styles.paper}>
                <ExtensionIcon fileExtension={fileName.extension} />
                {fileInfo && <Box sx={styles.fileInfo}>{fileInfo}</Box>}
                <Box sx={styles.fileInfo}>{getDisplayName(filePath)}</Box>
            </Paper>
        </Box>
    );
};

export default DocumentsItemComponent;
