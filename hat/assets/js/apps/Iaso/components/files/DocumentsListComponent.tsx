import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { displayDateFromTimestamp } from 'bluesquare-components';

import moment from 'moment/moment';
import { ShortFile } from 'Iaso/domains/instances/types/instance';
import { getFileName } from 'Iaso/utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';

const styles = {
    root: {
        marginTop: theme => theme.spacing(2),
        marginBottom: theme => theme.spacing(2),
    },
};

type Props = {
    docsList: ShortFile[];
    maxWidth?: number;
    url?: string;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    getInfos?: (filePath: string) => React.ReactNode;
    getExtraInfos?: (filePath: string) => React.ReactNode;
};

const DocumentsListComponent: FunctionComponent<Props> = ({
    docsList,
    maxWidth = 1,
    url = undefined,
    urlLabel = undefined,
    getInfos = () => null,
    getExtraInfos = () => null,
}) => {
    return (
        <Grid container spacing={2} sx={styles.root}>
            {docsList.map(file => (
                <Grid
                    item
                    sm={2}
                    md={maxWidth}
                    key={`${file.itemId}-${getFileName(file.path).name}`}
                >
                    <DocumentsItem
                        url={url}
                        urlLabel={urlLabel}
                        filePath={file.path}
                        fileInfo={displayDateFromTimestamp(file.createdAt)}
                        getDisplayName={() => (
                            <span>
                                {file.orgUnit.name}
                                <br />
                                {moment.unix(file.submittedAt).format('LTS')}
                                <br />
                                <b>{file.formName}</b>: {file.questionName}
                            </span>
                        )}
                        getInfos={getInfos}
                        getExtraInfos={getExtraInfos}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default DocumentsListComponent;
