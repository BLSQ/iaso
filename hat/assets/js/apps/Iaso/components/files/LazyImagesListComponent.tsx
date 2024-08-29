import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Grid, IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { LazyImage, LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { ShortFile } from '../../domains/instances/types/instance';
import { getFileName } from '../../utils/filesUtils';

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
    // eslint-disable-next-line no-unused-vars
    onImageClick: (index: number) => void;
    // eslint-disable-next-line no-unused-vars
    onImageFavoriteClick?: (id: number) => void;
    // eslint-disable-next-line no-unused-vars
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
                                                <IconButton
                                                    color="primary"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        backgroundColor:
                                                            'rgba(255, 255, 255, 0.7)',
                                                        boxShadow:
                                                            '0 0 10px rgba(0, 0, 0, 0.2)',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                'rgba(255, 255, 255, 0.9)',
                                                        },
                                                    }}
                                                    onClick={() =>
                                                        onImageFavoriteClick(
                                                            file.itemId,
                                                        )
                                                    }
                                                >
                                                    {!isDefaultImage(
                                                        file.itemId,
                                                    ) && <FavoriteBorderIcon />}
                                                    {isDefaultImage(
                                                        file.itemId,
                                                    ) && <FavoriteIcon />}
                                                </IconButton>
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
