import React, { useState } from 'react';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';

type ImagePreviewProps = {
    imageUrl: string | null;
    altText: string;
};

export const InstanceImagePreview: React.FC<ImagePreviewProps> = ({
    imageUrl,
    altText,
}) => {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<boolean>(false);

    if (!imageUrl) return null;
    return (
        <>
            <img
                src={imageUrl}
                alt={altText}
                onError={() => setError(true)}
                style={{
                    objectFit: 'contain',
                    maxWidth: '35vw',
                    cursor: !error ? 'pointer' : 'not-allowed',
                    maxHeight: '35vh',
                    width: '100%',
                    height: 'auto',
                }}
                onClick={() => setOpen(true)}
            />
            {open && !error && (
                <ImageGallery
                    closeLightbox={() => setOpen(false)}
                    imageList={[
                        {
                            path: imageUrl,
                            itemId: 0,
                            createdAt: 0,
                        },
                    ]}
                    currentIndex={0}
                />
            )}
        </>
    );
};
