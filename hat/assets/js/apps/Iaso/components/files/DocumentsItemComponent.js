import React from 'react';

import { Paper } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import AttachFile from '@mui/icons-material/AttachFile';

import {
    displayDateFromTimestamp,
    PdfSvg,
    TextSvg,
    WordSvg,
    ExcellSvg,
    CsvSvg,
} from 'bluesquare-components';
import { getFileName } from '../../utils/filesUtils.ts';

const styles = theme => ({
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
});

const renderIcon = (file, classes) => {
    switch (file.extension) {
        case 'pdf': {
            return <PdfSvg color="secondary" className={classes.icon} />;
        }
        case 'csv': {
            return <CsvSvg color="secondary" className={classes.icon} />;
        }
        case 'doc':
        case 'docx': {
            return <WordSvg color="secondary" className={classes.icon} />;
        }
        case 'xls':
        case 'xlsx': {
            return <ExcellSvg color="secondary" className={classes.icon} />;
        }
        case 'txt': {
            return <TextSvg color="secondary" className={classes.icon} />;
        }

        default:
            return (
                <AttachFile color="secondary" className={classes.muiIconb} />
            );
    }
};

function DocumentsItemComponent(props) {
    const { classes, file } = props;
    const fileName = getFileName(file.path);
    return (
        <a
            href={file.path}
            target="_blank"
            className={classes.link}
            rel="noreferrer"
        >
            <Paper className={classes.paper}>
                {renderIcon(file, classes)}
                <span className={classes.fileInfo}>
                    {displayDateFromTimestamp(file.createdAt)}
                </span>
                <span className={classes.fileInfo}>
                    {`${fileName.name}.${fileName.extension}`}
                </span>
            </Paper>
        </a>
    );
}

DocumentsItemComponent.propTypes = {
    file: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DocumentsItemComponent);
