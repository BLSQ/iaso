import React, { useState, FunctionComponent, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { Grid, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl } from 'bluesquare-components';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import DocumentsList from '../../../components/files/DocumentsListComponent';
import VideosList from '../../../components/files/VideosListComponent';
import InstancePopover from './InstancePopoverComponent';

import { SortedFiles, sortFilesType } from '../../../utils/filesUtils';
import { fetchInstanceDetail } from '../../../utils/requests';
import MESSAGES from '../messages';
import { Instance, ShortFile } from '../types/instance';

const minTabHeight = 'calc(100vh - 500px)';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
    },
    images: {
        height: 'auto',
        width: '100%',
        marginTop: theme.spacing(2),
    },
    hiddenImages: {
        width: '100%',
        height: minTabHeight,
        overflow: 'hidden',
        position: 'absolute',
        zIndex: '-1',
        marginTop: theme.spacing(2),
    },
    tabContainer: {
        minHeight: minTabHeight,
        backgroundColor: 'white',
        marginTop: theme.spacing(2),
    },
}));
type Props = {
    instanceDetail?: Instance;
    files: ShortFile[];
    // eslint-disable-next-line no-unused-vars
    onLightBoxToggled?: (value: boolean) => void;
    fetchDetails?: boolean;
    fetching?: boolean;
};
const InstancesFilesList: FunctionComponent<Props> = ({
    instanceDetail,
    files = [],
    fetchDetails = false,
    onLightBoxToggled = () => null,
    fetching = false,
}) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [viewerIsOpen, setViewerIsOpen] = useState<boolean>(false);
    const sortedFiles: SortedFiles = useMemo(
        () => sortFilesType(files || []),
        [files],
    );
    const [currentInstance, setCurrentInstance] = useState(instanceDetail);
    const [tab, setTab] = useState('images');

    const handleChangeTab = newTab => {
        setTab(newTab);
    };

    const handleSetCurrentIndex = (fileIndex, fileTypeKey) => {
        if (fileIndex >= 0) {
            const file = sortedFiles[fileTypeKey][fileIndex];
            if (fetchDetails) {
                setCurrentInstance(undefined);
                if (file) {
                    fetchInstanceDetail(dispatch, file.itemId).then(
                        newInstanceDetail => {
                            setCurrentInstance(newInstanceDetail);
                        },
                    );
                }
            }
        }
        setCurrentImageIndex(fileIndex);
    };

    const handleOpenLightbox = index => {
        handleSetCurrentIndex(index, 'images');
        setViewerIsOpen(true);
        onLightBoxToggled(true);
    };

    const handleCloseLightbox = () => {
        handleSetCurrentIndex(-1, 'images');
        setViewerIsOpen(false);
        setCurrentInstance(fetchDetails ? undefined : currentInstance);
        onLightBoxToggled(false);
    };

    if (fetching || !files) return null;
    if (files.length === 0) {
        return (
            <Grid container spacing={0}>
                <Grid item xs={5} />
                <Grid item xs={2}>
                    <ErrorPaperComponent
                        message={intl.formatMessage(MESSAGES.missingFile)}
                    />
                </Grid>
                <Grid item xs={5} />
            </Grid>
        );
    }
    return (
        <section className={classes.root}>
            <Tabs
                variant="fullWidth"
                indicatorColor="primary"
                value={tab}
                onChange={(event, newTab) => handleChangeTab(newTab)}
            >
                {Object.keys(sortedFiles).map(fileKey => {
                    const filesByType = sortedFiles[fileKey];
                    let filesCount = 0;
                    if (Array.isArray(filesByType)) {
                        filesCount = filesByType.length;
                    } else {
                        Object.keys(filesByType).forEach(fileSubKey => {
                            filesCount += filesByType[fileSubKey].length;
                        });
                    }
                    return (
                        <Tab
                            disabled={filesCount === 0}
                            key={fileKey}
                            sx={{
                                padding: theme => theme.spacing(1),
                                fontSize: 12,
                            }}
                            value={fileKey}
                            label={`${intl.formatMessage(
                                MESSAGES[fileKey],
                            )} (${filesCount})`}
                        />
                    );
                })}
            </Tabs>
            <div
                className={
                    tab !== 'images' ? classes.hiddenImages : classes.images
                }
            >
                <LazyImagesList
                    imageList={sortedFiles.images}
                    onImageClick={index => handleOpenLightbox(index)}
                />
            </div>
            {tab === 'videos' && (
                <div className={classes.tabContainer}>
                    <VideosList videoList={sortedFiles.videos} />
                </div>
            )}
            {tab === 'docs' && (
                <div className={classes.tabContainer}>
                    <DocumentsList docsList={sortedFiles.docs} />
                </div>
            )}
            {tab === 'others' && (
                <div className={classes.tabContainer}>
                    <DocumentsList docsList={sortedFiles.others} />
                </div>
            )}
            {viewerIsOpen && (
                <ImageGallery
                    imageList={sortedFiles.images}
                    closeLightbox={handleCloseLightbox}
                    currentIndex={currentImageIndex}
                    setCurrentIndex={newIndex =>
                        handleSetCurrentIndex(newIndex, 'images')
                    }
                    getExtraInfos={() => (
                        <InstancePopover instanceDetail={currentInstance} />
                    )}
                />
            )}
        </section>
    );
};

export default InstancesFilesList;
