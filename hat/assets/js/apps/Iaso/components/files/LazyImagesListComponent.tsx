import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';

import { LoadingSpinner, LazyImage } from 'bluesquare-components';
import { getFileName } from '../../utils/filesUtils';
import { ShortFile } from '../../domains/instances/types/instance';

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
};

const LazyImagesList: FunctionComponent<Props> = ({
    imageList,
    onImageClick,
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
                                        onClick={() => onImageClick(index)}
                                        role="button"
                                        tabIndex={0}
                                        sx={styles.imageContainer}
                                        style={{
                                            backgroundImage: loading
                                                ? 'none'
                                                : `url('${src}')`,
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
