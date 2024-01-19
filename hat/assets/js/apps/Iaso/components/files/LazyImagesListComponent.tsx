import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { grey } from '@mui/material/colors';

import { LoadingSpinner, LazyImage } from 'bluesquare-components';
import { getFileName } from '../../utils/filesUtils';
import { ShortFile } from '../../domains/instances/types/instance';

const useStyles = makeStyles(() => ({
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
}));

type Props = {
    imageList: ShortFile[];
    // eslint-disable-next-line no-unused-vars
    onImageClick: (index: number) => void;
    xs: number;
};

const LazyImagesList: FunctionComponent<Props> = ({
    imageList,
    onImageClick,
    xs = 3,
}) => {
    const classes = useStyles();
    return (
        <Grid container spacing={2}>
            {imageList.map((file, index) => (
                <Grid
                    item
                    xs={xs}
                    key={`${file.itemId}-${getFileName(file.path).name}`}
                    className={classes.imageItem}
                >
                    <LazyImage
                        src={file.path}
                        visibilitySensorProps={{
                            partialVisibility: true,
                        }}
                    >
                        {(src, loading, isVisible) => (
                            <div
                                onClick={() => onImageClick(index)}
                                role="button"
                                tabIndex={0}
                                className={classes.imageContainer}
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
                            </div>
                        )}
                    </LazyImage>
                </Grid>
            ))}
        </Grid>
    );
};

export default LazyImagesList;
