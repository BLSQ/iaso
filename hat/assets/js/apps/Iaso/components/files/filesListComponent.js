import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import LazyImage from 'react-lazy-progressive-image';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { injectIntl, intlShape } from 'react-intl';

import {
    Grid,
    withStyles,
} from '@material-ui/core';
import grey from '@material-ui/core/colors/grey';

import PropTypes from 'prop-types';

import LoadingSpinner from '../LoadingSpinnerComponent';
import ErrorPaperComponent from '../papers/ErrorPaperComponent';

const imgExtensions = ['jpg', 'JPG', 'png'];

const getFileName = (path) => {
    const fullName = path.split('/').slice(-1)[0].split('.');
    return ({
        name: fullName[0],
        extension: fullName[1],
    });
};

const sortFilesType = (files) => {
    const filesList = {
        images: [],
    };
    files.forEach((f) => {
        const fileName = getFileName(f.path);
        if (imgExtensions.indexOf(fileName.extension) !== -1) {
            filesList.images.push(f);
        } else if (!filesList[fileName.extension]) {
            filesList[fileName.extension] = [f];
        } else {
            filesList[fileName.extension].push(f);
        }
    });
    return (filesList);
};


const styles = () => ({
    modalContainer: {
        '& .fullscreen': {
            zIndex: 100,
        },
    },
    imageListContainer: {
        display: 'flex',
        width: '100%',
        flexWrap: 'wrap',
    },
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
            {
                sortedFiles.images.map((file, index) => (

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
                                    onClick={() => openLightbox(index)}
                                    role="button"
                                    tabIndex={0}
                                    className={classes.imageContainer}
                                    style={{
                                        backgroundImage: loading ? 'none' : `url('${src}')`,
                                    }}
                                >
                                    {
                                        loading && isVisible && <LoadingSpinner fixed={false} transparent padding={4} size={25} />
                                    }

                                </div>
                            )}
                        </LazyImage>
                    </Grid>
                ))
            }
            <div className={classes.modalContainer}>
                <ModalGateway>
                    {viewerIsOpen ? (
                        <Modal onClose={closeLightbox}>
                            <Carousel
                                currentIndex={currentImage}
                                views={files.map(file => ({
                                    ...file,
                                    srcset: file.path,
                                    src: file.path,
                                }))}
                            />
                        </Modal>
                    ) : null}
                </ModalGateway>
            </div>
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
