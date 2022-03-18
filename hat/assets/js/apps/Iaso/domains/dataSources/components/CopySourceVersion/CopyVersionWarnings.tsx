/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { Grid, Typography, makeStyles } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import MESSAGES from '../../messages';
import { useDataSourceAsDropDown } from '../../requests';

type Props = {
    dataSourceName: string;
    dataSourceVersionNumber: string | number | null;
    destinationSourceId: string | number | null;
    destinationVersionNumber: string | number | null;
    forceOverwrite: boolean;
};

const warningStyle = theme => ({
    source: { fontWeight: 'bold' },
    destination: { fontWeight: 'bold', color: theme.palette.primary.main },
});

const useWarningStyles = makeStyles(warningStyle);

const NoDestinationVersionNumber = ({
    sourceName,
    sourceVersion,
    destinationName,
}) => {
    const classes = useWarningStyles();
    return (
        <Grid container item spacing={1}>
            <Grid item>
                <Typography className={classes.source}>
                    <FormattedMessage
                        {...MESSAGES.copiedVersion}
                        values={{
                            sourceName,
                            versionNumber: sourceVersion,
                        }}
                    />
                </Typography>
            </Grid>
            <Grid item>
                <Typography>
                    <FormattedMessage {...MESSAGES.willBeCopied} />
                </Typography>
            </Grid>
            <Grid item>
                <Typography className={classes.destination}>
                    <FormattedMessage
                        {...MESSAGES.copyToNextVersion}
                        values={{
                            sourceName: destinationName,
                        }}
                    />
                </Typography>
            </Grid>
        </Grid>
    );
};

const WithDestinationVersionNumber = ({
    sourceName,
    sourceVersion,
    destinationName,
    destinationVersionNumber,
    forceOverwrite,
}) => {
    const classes = useWarningStyles();

    return (
        <Grid container item spacing={1}>
            <Grid item>
                <Typography className={classes.source}>
                    <FormattedMessage
                        {...MESSAGES.copiedVersion}
                        values={{
                            sourceName,
                            versionNumber: sourceVersion,
                        }}
                    />
                </Typography>
            </Grid>
            <Grid item>
                <Typography>
                    <FormattedMessage {...MESSAGES.willBeCopied} />
                </Typography>
            </Grid>
            <Grid item>
                <Typography className={classes.destination}>
                    <FormattedMessage
                        {...MESSAGES.copyToSourceWithVersion}
                        values={{
                            sourceName: destinationName,
                            versionNumber: destinationVersionNumber,
                        }}
                    />{' '}
                </Typography>
            </Grid>
            {forceOverwrite && (
                <Grid item>
                    <Typography>
                        <FormattedMessage {...MESSAGES.overwriteWarning} />{' '}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
};

export const WarningMessage: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceVersionNumber,
    destinationSourceId,
    destinationVersionNumber,
    forceOverwrite,
}) => {
    const { data: dataSources } = useDataSourceAsDropDown();
    const destinationSourceName = destinationSourceId
        ? dataSources.filter(
              dataSource => dataSource.value === destinationSourceId,
          )[0]?.label
        : null;
    if (destinationVersionNumber) {
        return (
            <WithDestinationVersionNumber
                sourceName={dataSourceName}
                sourceVersion={dataSourceVersionNumber}
                destinationName={
                    destinationSourceId ? destinationSourceName : dataSourceName
                }
                destinationVersionNumber={destinationVersionNumber}
                forceOverwrite={forceOverwrite}
            />
        );
    }
    return (
        <NoDestinationVersionNumber
            sourceName={dataSourceName}
            sourceVersion={dataSourceVersionNumber}
            destinationName={
                destinationSourceId ? destinationSourceName : dataSourceName
            }
        />
    );
};
