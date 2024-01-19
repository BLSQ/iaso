import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { getFileName } from '../../utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';
import { ShortFile } from '../../domains/instances/types/instance';

const useStyles = makeStyles(theme => ({
    root: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
}));

type Props = {
    docsList: ShortFile[];
};

const DocumentsListComponent: FunctionComponent<Props> = ({ docsList }) => {
    const classes = useStyles();
    return (
        <Grid container spacing={2} className={classes.root}>
            {docsList.map(file => (
                <Grid
                    item
                    sm={2}
                    md={1}
                    key={`${file.itemId}-${getFileName(file.path).name}`}
                >
                    <DocumentsItem file={file} />
                </Grid>
            ))}
        </Grid>
    );
};

export default DocumentsListComponent;
