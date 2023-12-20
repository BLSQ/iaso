/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormattedMessage } from 'react-intl';
import MESSAGES from '../../messages';
import { useDataSourceAsDropDown } from '../../requests';

type Props = {
    dataSourceName: string;
    dataSourceVersionNumber: string | number | null;
    destinationSourceId: string | number | null;
    destinationVersionNumber: string | number | null;
};

const warningStyle = {
    source: { fontWeight: 'bold' },
    destination: { fontWeight: 'bold' },
};

const useWarningStyles = makeStyles(warningStyle);

export const WarningMessage: FunctionComponent<Props> = ({
    dataSourceName,
    dataSourceVersionNumber,
    destinationSourceId,
    destinationVersionNumber,
}) => {
    const { data: dataSources } = useDataSourceAsDropDown();
    const classes = useWarningStyles();
    const destinationSourceName = destinationSourceId
        ? dataSources?.filter(
              dataSource => dataSource.value === destinationSourceId,
          )[0]?.label
        : null;
    return (
        <Grid
            container
            item
            spacing={1}
            justifyContent="center"
            data-test={`copyversion-warning-${destinationSourceName}`}
        >
            <Grid item>
                <Typography className={classes.source} variant="h6">
                    <FormattedMessage
                        {...MESSAGES.copiedVersion}
                        values={{
                            sourceName: dataSourceName,
                            versionNumber: dataSourceVersionNumber,
                        }}
                    />
                </Typography>
            </Grid>
            <Grid item>
                <Typography variant="h6">
                    <FormattedMessage {...MESSAGES.willBeCopied} />
                </Typography>
            </Grid>
            <Grid item>
                <Typography className={classes.destination} variant="h6">
                    <FormattedMessage
                        {...MESSAGES.copyToSourceWithVersion}
                        values={{
                            sourceName: destinationSourceName ?? dataSourceName,
                            versionNumber: destinationVersionNumber,
                        }}
                    />{' '}
                </Typography>
            </Grid>
        </Grid>
    );
};
