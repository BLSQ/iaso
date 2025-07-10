import React, { FunctionComponent, useMemo, useState } from 'react';

import { Box, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl } from 'bluesquare-components';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import DocumentsList from '../../../components/files/DocumentsListComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import VideosList from '../../../components/files/VideosListComponent';

import { openSnackBar } from '../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../constants/snackBars';
import { getRequest } from '../../../libs/Api';
import { SortedFiles, sortFilesType } from '../../../utils/filesUtils';
import MESSAGES from '../messages';
import { Instance, ShortFile } from '../types/instance';
import InstancePopover from './InstancePopoverComponent';

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
    },
}));

const fetchInstanceDetail = instanceId =>
    getRequest(`/api/instances/${instanceId}/`)
        .then(instance => instance)
        .catch(error => {
            openSnackBar(errorSnackBar('fetchInstanceError', null, error));
            console.error('Error while fetching instance detail:', error);
        });

const ExtraInfoComponent = ({ instanceDetail }) => (
    <InstancePopover instanceDetail={instanceDetail} />
);

type Props = {
    instanceDetail?: Instance;
    files: ShortFile[];
    onLightBoxToggled?: (value: boolean) => void;
    fetchDetails?: boolean;
    fetchingFile?: boolean;
    fetching?: boolean;
    showLink?: boolean;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
};
const InstancesFilesList: FunctionComponent<Props> = ({
    instanceDetail,
    files = [],
    fetchDetails = false,
    fetchingFile = false,
    onLightBoxToggled = () => null,
    fetching = false,
    showLink = false,
    urlLabel = undefined,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
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
            if (fetchDetails || fetchingFile) {
                setCurrentInstance(undefined);
                if (file) {
                    fetchInstanceDetail(file.itemId).then(newInstanceDetail => {
                        setCurrentInstance(newInstanceDetail);
                    });
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
        return <Box p={2}>{formatMessage(MESSAGES.missingFile)}</Box>;
    }

    return (
        <section className={classes.root}>
            <Tabs
                variant="fullWidth"
                indicatorColor="primary"
                value={tab}
                onChange={(_, newTab) => handleChangeTab(newTab)}
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
                            label={`${formatMessage(
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
                    url={
                        showLink
                            ? `/forms/submission/instanceId/${sortedFiles.images[currentImageIndex].itemId}`
                            : null
                    }
                    urlLabel={urlLabel}
                    getExtraInfos={() =>
                        ExtraInfoComponent({ instanceDetail: currentInstance })
                    }
                />
            )}
        </section>
    );
};

export default InstancesFilesList;
