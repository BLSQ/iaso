import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { displayDateFromTimestamp } from 'bluesquare-components';

import { ShortFile } from '../../domains/instances/types/instance';
import { getFileName } from '../../utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';

const styles = {
    root: {
        marginTop: theme => theme.spacing(2),
        marginBottom: theme => theme.spacing(2),
    },
};

type Props = {
    docsList: ShortFile[];
};

const DocumentsListComponent: FunctionComponent<Props> = ({ docsList }) => {
    return (
        <Grid container spacing={2} sx={styles.root}>
            {docsList.map(file => (
                <Grid
                    item
                    sm={2}
                    md={1}
                    key={`${file.itemId}-${getFileName(file.path).name}`}
                >
                    <DocumentsItem
                        filePath={file.path}
                        fileInfo={displayDateFromTimestamp(file.createdAt)}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default DocumentsListComponent;
