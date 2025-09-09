import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

const useStyles = makeStyles(theme => ({
    link: {
        color: 'inherit',
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(3),
    },
}));

type Props = {
    url?: string | null;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
};

export const ImageGalleryLink: FunctionComponent<Props> = ({
    url,
    urlLabel,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    if (!url) return null;

    return (
        <Box className={classes.link}>
            <LinkWithLocation to={url}>
                {formatMessage(urlLabel)}
            </LinkWithLocation>
        </Box>
    );
};
