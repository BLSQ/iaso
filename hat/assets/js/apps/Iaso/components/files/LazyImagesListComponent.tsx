import { Box, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import { LazyImage, LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { ShortFile } from '../../domains/instances/types/instance';
import { getFileName } from '../../utils/filesUtils';
import { FavButton } from './FavButton';

const styles = {
    imageItem: {
        width: '100%',
        height: '200px',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: grey['100'],
        overflow: 'hidden',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        cursor: 'pointer',
    },
};

type Props = {
    imageList: ShortFile[];
    onImageClick: (index: number) => void;
    onImageFavoriteClick?: (id: number) => void;
    isDefaultImage?: (id: number) => boolean;
};

const LazyImagesList: FunctionComponent<Props> = ({
    imageList,
    onImageClick,
    onImageFavoriteClick,
    isDefaultImage,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number | undefined>(undefined);
    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);
    return (
        <Box ref={containerRef}>
            {width && (
                <Grid container spacing={2}>
                    {imageList.map((file, index) => (
                        <Grid
                            item
                            xs={width < 500 ? 6 : 3}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                            sx={styles.imageItem}
                        >
                            <LazyImage
                                src={file.path}
                                visibilitySensorProps={{
                                    partialVisibility: true,
                                }}
                            >
                                {(src, loading, isVisible) => (
                                    <Box
                                        sx={{
                                            ...styles.imageContainer,
                                            position: 'relative',
                                            backgroundImage: loading
                                                ? 'none'
                                                : `url('${src}')`,
                                        }}
                                    >
                                        {onImageFavoriteClick &&
                                            isDefaultImage && (
                                                <FavButton
                                                    file={file}
                                                    onImageFavoriteClick={
                                                        onImageFavoriteClick
                                                    }
                                                    isDefaultImage={
                                                        isDefaultImage
                                                    }
                                                />
                                            )}
                                        <Box
                                            onClick={() => onImageClick(index)}
                                            role="button"
                                            tabIndex={0}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                            }}
                                        >
                                            {loading && isVisible && (
                                                <LoadingSpinner
                                                    fixed={false}
                                                    transparent
                                                    padding={4}
                                                    size={25}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </LazyImage>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default LazyImagesList;
