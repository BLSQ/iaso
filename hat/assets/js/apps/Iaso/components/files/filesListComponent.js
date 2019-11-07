import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from 'react-intl';

import {
    Grid,
    withStyles,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import ImageGallery from '../dialogs/ImageGalleryComponent';
import LazyImagesList from './LazyImagesListComponent';
import { sortFilesType } from '../../utils/filesUtils';

const styles = () => ({
});

function FilesList(props) {
    const {
        fetching,
        files,
        classes,
        intl: {
            formatMessage,
        },
    } = props;
    const [currentImage, setCurrentImage] = useState(0);
    const [viewerIsOpen, setViewerIsOpen] = useState(false);
    const openLightbox = useCallback((index) => {
        setCurrentImage(index);
        setViewerIsOpen(true);
    }, []);

    const closeLightbox = () => {
        setCurrentImage(0);
        setViewerIsOpen(false);
    };

    if (fetching) return null;
    if (files.length === 0) {
        return (
            <Grid container spacing={0}>
                <Grid item xs={5} />
                <Grid item xs={2}>
                    <ErrorPaperComponent message={formatMessage({
                        defaultMessage: 'Cannot find an instance with a file',
                        id: 'iaso.instance.missingFile',
                    })}
                    />
                </Grid>
                <Grid item xs={5} />
            </Grid>
        );
    }
    const sortedFiles = sortFilesType(files);
    return (
        <Grid container spacing={2}>
            <LazyImagesList
                imageList={sortedFiles.images}
                onImageClick={index => openLightbox(index)}
            />
            {
                viewerIsOpen
                && (
                    <ImageGallery
                        imageList={sortedFiles.images}
                        closeLightbox={closeLightbox}
                        currentIndex={currentImage}
                        setCurrentIndex={setCurrentImage}
                        getExtraInfos={file => `${file.orgUnitName} - ${file.createdAt}`}
                    />
                )
            }
        </Grid>
    );
}


FilesList.propTypes = {
    files: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    fetching: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(connect(MapStateToProps, MapDispatchToProps)(injectIntl(FilesList)));
