import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';

import { getFileName } from '../../utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';
import { ShortFile } from '../../domains/instances/types/instance';

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
                    sx={{ width: '100%' }} // Assuming you want a style here, adjust as needed
                >
                    <DocumentsItem file={file} />
                </Grid>
            ))}
        </Grid>
    );
};

export default DocumentsListComponent;
