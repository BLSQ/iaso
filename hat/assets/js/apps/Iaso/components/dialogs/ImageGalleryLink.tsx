import React, { FunctionComponent } from 'react';
import { Box, Theme } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';

const styles = {
    link: {
        color: 'inherit',
        position: 'absolute',
        bottom: (theme: Theme) => theme.spacing(2),
        right: (theme: Theme) => theme.spacing(3),
    },
    linkFullscreen: {
        bottom: (theme: Theme) => theme.spacing(2),
        right: 'auto',
        left: (theme: Theme) => theme.spacing(2),
        color: 'white',
        '& a': {
            color: 'white',
        },
        '& a:hover': {
            color: 'white',
            textDecoration: 'underline',
        },
    },
};

type Props = {
    url?: string | null;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    isFullScreen?: boolean;
};

export const ImageGalleryLink: FunctionComponent<Props> = ({
    url,
    urlLabel,
    isFullScreen = false,
}) => {
    const { formatMessage } = useSafeIntl();
    if (!url) return null;

    return (
        <Box sx={[styles.link, isFullScreen && styles.linkFullscreen]}>
            <LinkWithLocation to={url}>
                {formatMessage(urlLabel)}
            </LinkWithLocation>
        </Box>
    );
};
