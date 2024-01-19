import React, { FunctionComponent } from 'react';

import { Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

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

const useStyles = makeStyles(theme => ({
    paper: {
        width: '100%',
        height: 120,
        padding: theme.spacing(1),
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
    muiIconb: {
        width: 50,
        margin: theme.spacing(1, 0),
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
}));

const renderIcon = (fileExtension: string, classes: any) => {
    switch (fileExtension) {
        case 'pdf':
            return <PdfSvg color="secondary" className={classes.icon} />;
        case 'csv':
            return <CsvSvg color="secondary" className={classes.icon} />;
        case 'doc':
        case 'docx':
            return <WordSvg color="secondary" className={classes.icon} />;
        case 'xls':
        case 'xlsx':
            return <ExcellSvg color="secondary" className={classes.icon} />;
        case 'txt':
            return <TextSvg color="secondary" className={classes.icon} />;
        default:
            return (
                <AttachFile color="secondary" className={classes.muiIconb} />
            );
    }
};

type Props = {
    file: ShortFile;
};

const DocumentsItemComponent: FunctionComponent<Props> = ({ file }) => {
    const classes = useStyles();
    const fileName = getFileName(file.path);
    return (
        <a
            href={file.path}
            target="_blank"
            className={classes.link}
            rel="noreferrer"
        >
            <Paper className={classes.paper}>
                {renderIcon(file.extension, classes)}
                <span className={classes.fileInfo}>
                    {displayDateFromTimestamp(file.createdAt)}
                </span>
                <span className={classes.fileInfo}>
                    {`${fileName.name}.${fileName.extension}`}
                </span>
            </Paper>
        </a>
    );
};

export default DocumentsItemComponent;
