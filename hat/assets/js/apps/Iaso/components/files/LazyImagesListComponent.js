import React, { Component } from 'react';
import isEqual from 'lodash/isEqual';

import { Grid } from '@mui/material';
import { withStyles } from '@mui/styles';
import { grey } from '@mui/material/colors';

import PropTypes from 'prop-types';

import { LoadingSpinner, LazyImage } from 'bluesquare-components';
import { getFileName } from '../../utils/filesUtils';

const styles = () => ({
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
});

class LazyImagesList extends Component {
    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.imageList, this.props.imageList);
    }

    render() {
        const { imageList, classes, onImageClick } = this.props;
        return (
            <Grid container spacing={2}>
                {imageList.map((file, index) => (
                    <Grid
                        item
                        xs={3}
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
    }
}

LazyImagesList.propTypes = {
    imageList: PropTypes.array.isRequired,
    onImageClick: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LazyImagesList);
