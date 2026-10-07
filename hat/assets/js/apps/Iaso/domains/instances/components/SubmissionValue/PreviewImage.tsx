import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { InstanceImagePreview } from '../InstanceImagePreview';

/**
 * Left-aligned, width-capped wrapper for the shared image preview. Caps the
 * image at the design's 340px (InstanceImagePreview itself is 35vw, which is
 * too wide on large screens and overflows a two-column cell) and pins it to the
 * start of the value column so it lines up under its label.
 */
export const PreviewImage: FunctionComponent<{ url: string; alt: string }> = ({
    url,
    alt,
}) => (
    <Box
        sx={{
            width: '100%',
            maxWidth: 340,
            alignSelf: 'flex-start',
            // InstanceImagePreview draws the image with object-fit: contain, so
            // a portrait photo capped by max-height gets centered (and letter-
            // boxed) inside its wider box; pin it to the left so it lines up
            // flush under the label with no phantom left margin.
            '& img': { objectPosition: 'left center' },
        }}
    >
        <InstanceImagePreview imageUrl={url} altText={alt} />
    </Box>
);
