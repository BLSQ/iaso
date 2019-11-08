import React, { Component } from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { injectIntl, intlShape } from 'react-intl';

import {
    Grid,
    withStyles,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import ImageGallery from '../dialogs/ImageGalleryComponent';
import LazyImagesList from './LazyImagesListComponent';
import InstancePopover from '../popover/InstancePopoverComponent';

import { sortFilesType } from '../../utils/filesUtils';
import { fetchInstanceDetail } from '../../utils/requests';

const styles = () => ({
});

class InstancesFilesList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentImageIndex: 0,
            viewerIsOpen: false,
            sortedFiles: sortFilesType(props.files),
            instanceDetail: null,
        };
    }

    componentDidUpdate(prevProps) {
        const {
            files,
        } = this.props;
        if (!isEqual(prevProps.files, files)) {
            this.setFiles(files);
        }
    }

    setFiles(files) {
        this.setState({
            sortedFiles: sortFilesType(files),
        });
    }

    setCurrentIndex(fileIndex, fileTypeKey) {
        const {
            dispatch,
        } = this.props;
        const {
            sortedFiles,
        } = this.state;
        if (fileIndex >= 0) {
            const file = sortedFiles[fileTypeKey][fileIndex];
            this.setState({
                instanceDetail: null,
            });
            if (file) {
                fetchInstanceDetail(dispatch, file.itemId).then((instanceDetail) => {
                    this.setState({
                        instanceDetail,
                    });
                });
            }
        }
        this.setState({
            currentImageIndex: fileIndex,
        });
    }

    openLightbox(index) {
        this.setCurrentIndex(index, 'images');
        this.setState({
            viewerIsOpen: true,
        });
    }

    closeLightbox() {
        this.setCurrentIndex(-1, 'images');
        this.setState({
            viewerIsOpen: false,
            instanceDetail: null,
        });
    }

    render() {
        const {
            fetching,
            files,
            classes,
            intl: {
                formatMessage,
            },
        } = this.props;

        const {
            currentImageIndex,
            viewerIsOpen,
            sortedFiles,
            instanceDetail,
        } = this.state;
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

        return (
            <Grid container spacing={2}>
                <LazyImagesList
                    imageList={sortedFiles.images}
                    onImageClick={index => this.openLightbox(index)}
                />
                {
                    viewerIsOpen
                    && (
                        <ImageGallery
                            imageList={sortedFiles.images}
                            closeLightbox={() => this.closeLightbox()}
                            currentIndex={currentImageIndex}
                            setCurrentIndex={newIndex => this.setCurrentIndex(newIndex, 'images')}
                            getExtraInfos={() => <InstancePopover instanceDetail={instanceDetail} />}
                        />
                    )
                }
            </Grid>
        );
    }
}


InstancesFilesList.propTypes = {
    files: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    fetching: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstancesFilesList)));
