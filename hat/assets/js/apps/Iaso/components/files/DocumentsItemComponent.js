import React from 'react';

import { withStyles, Paper } from '@material-ui/core';
import { Link } from 'react-router';

import PropTypes from 'prop-types';

import AttachFile from '@material-ui/icons/AttachFile';

import { getFileName } from '../../utils/filesUtils';
import PdfSvg from '../svg/PdfSvgComponent';
import TxtSvg from '../svg/TxtSvgComponent';
import WordSvg from '../svg/WordSvgComponent';
import ExcellSvg from '../svg/ExcellSvgComponent';
import CsvSvg from '../svg/CsvSvgComponent';
import { displayDateFromTimestamp } from '../../utils/intlUtil';

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
            return <TxtSvg color="secondary" className={classes.icon} />;
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
        <Link
            to={file.path}
            target="_blank"
            size="small"
            className={classes.link}
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
        </Link>
    );
}

DocumentsItemComponent.propTypes = {
    file: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DocumentsItemComponent);
