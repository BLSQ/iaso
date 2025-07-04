import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';

import { Box, Tab, TablePagination, Tabs } from '@mui/material';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useGetInstance } from 'Iaso/domains/registry/hooks/useGetInstances';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import DocumentsList from '../../../components/files/DocumentsListComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import VideosList from '../../../components/files/VideosListComponent';

import { SxStyles } from '../../../types/general';
import MESSAGES from '../messages';
import { useGetInstancesFiles, useGetInstancesFilesCount } from '../requests';
import { Instance } from '../types/instance';
import InstancePopover from './InstancePopoverComponent';

const ExtraInfoComponent = ({
    instanceDetail,
}: {
    instanceDetail?: Instance;
}) => <InstancePopover instanceDetail={instanceDetail} />;
const minTabHeight = 'calc(100vh - 500px)';

const styles: SxStyles = {
    root: {
        position: 'relative',
    },
    images: {
        height: 'auto',
        width: '100%',
        marginTop: theme => theme.spacing(2),
    },
    hiddenImages: {
        width: '100%',
        height: minTabHeight,
        overflow: 'hidden',
        position: 'absolute',
        zIndex: '-1',
        marginTop: theme => theme.spacing(2),
    },
    tabContainer: {
        minHeight: minTabHeight,
        backgroundColor: 'white',
    },
};

const TYPES_MAP: Record<
    'images' | 'videos' | 'docs' | 'others',
    'image_only' | 'video_only' | 'document_only' | 'other_only'
> = {
    images: 'image_only',
    videos: 'video_only',
    docs: 'document_only',
    others: 'other_only',
};

const DEFAULT_FILES_PER_PAGES = 100;
type Props = {
    params: Record<string, string>;
    updateParams: (params: Record<string, string | undefined>) => void;
};
export const PaginatedInstancesFilesList: FunctionComponent<Props> = ({
    params,
    updateParams,
}) => {
    const { formatMessage } = useSafeIntl();

    const rowsPerPage = params?.fileRowsPerPage
        ? parseInt(params.fileRowsPerPage, 10)
        : DEFAULT_FILES_PER_PAGES;
    const page = params?.filePage ? parseInt(params.filePage, 10) : 0;

    const [viewerIsOpen, setViewerIsOpen] = useState<boolean>(false);
    const [tab, setTab] = useState('images');
    const [currentInstanceId, setCurrentInstanceId] = useState<
        number | undefined
    >();
    const [currentImageIndex, setCurrentImageIndex] = useState<
        number | undefined
    >(undefined);

    const { data: instancesFilesCount } = useGetInstancesFilesCount(params);
    const { data: currentInstance } = useGetInstance(currentInstanceId);

    const handleChangePage = useCallback(
        (_event, newPage) => {
            updateParams({ ...params, filePage: newPage });
        },
        [params, updateParams],
    );
    const handleChangeRowsPerPage = useCallback(
        event => {
            const newRowsPerPage = event.target.value;
            updateParams({
                ...params,
                filePage: undefined,
                fileRowsPerPage: newRowsPerPage,
            });
        },
        [params, updateParams],
    );
    const { data: files, isFetching: loadingFiles } = useGetInstancesFiles(
        params,
        rowsPerPage,
        page,
        TYPES_MAP[tab],
    );
    const diplayedFiles = useMemo(() => {
        if (loadingFiles) {
            return [];
        }
        return files?.results;
    }, [loadingFiles, files]);

    const handleChangeTab = useCallback(
        (newTab: string) => {
            updateParams({ ...params, filePage: '0' });
            setTab(newTab);
        },
        [params, updateParams],
    );
    const handleSetCurrentIndex = useCallback(
        (fileIndex?: number) => {
            if (fileIndex !== undefined) {
                const instanceId = diplayedFiles[fileIndex]?.itemId;
                if (instanceId) {
                    setCurrentInstanceId(instanceId);
                }
            }
            setCurrentImageIndex(fileIndex);
        },
        [setCurrentImageIndex, setCurrentInstanceId, diplayedFiles],
    );
    const handleOpenLightbox = useCallback(
        (index: number) => {
            handleSetCurrentIndex(index);
            setViewerIsOpen(true);
        },
        [handleSetCurrentIndex],
    );
    const handleCloseLightbox = useCallback(() => {
        handleSetCurrentIndex();
        setViewerIsOpen(false);
    }, [setViewerIsOpen, handleSetCurrentIndex]);

    return (
        <Box sx={styles.root}>
            <Tabs
                variant="fullWidth"
                indicatorColor="primary"
                value={tab}
                onChange={(_, newTab) => handleChangeTab(newTab)}
            >
                {Object.keys(TYPES_MAP).map(type => (
                    <Tab
                        disabled={false}
                        key={type}
                        sx={{
                            padding: theme => theme.spacing(1),
                            fontSize: 12,
                        }}
                        value={type}
                        label={`${formatMessage(
                            MESSAGES[type],
                        )} (${instancesFilesCount?.[type] || 0})`}
                    />
                ))}
            </Tabs>
            {loadingFiles && (
                <Box
                    p={2}
                    display="flex"
                    justifyContent="center"
                    alignContent="center"
                    height="30vh"
                >
                    <LoadingSpinner absolute={false} fixed={false} />
                </Box>
            )}
            {!loadingFiles && (
                <>
                    {diplayedFiles.length === 0 && (
                        <Box p={2}>{formatMessage(MESSAGES.missingFile)}</Box>
                    )}
                    {diplayedFiles.length > 0 && (
                        <>
                            <Box
                                sx={
                                    tab !== 'images'
                                        ? styles.hiddenImages
                                        : styles.images
                                }
                            >
                                <LazyImagesList
                                    imageList={diplayedFiles}
                                    onImageClick={handleOpenLightbox}
                                />
                            </Box>
                            {tab === 'videos' && (
                                <Box sx={styles.tabContainer} mt={2}>
                                    <VideosList videoList={diplayedFiles} />
                                </Box>
                            )}
                            {tab === 'docs' && (
                                <Box sx={styles.tabContainer}>
                                    <DocumentsList docsList={diplayedFiles} />
                                </Box>
                            )}
                            {tab === 'others' && (
                                <Box sx={styles.tabContainer}>
                                    <DocumentsList docsList={diplayedFiles} />
                                </Box>
                            )}
                            {viewerIsOpen && (
                                <ImageGallery
                                    imageList={diplayedFiles}
                                    closeLightbox={handleCloseLightbox}
                                    setCurrentIndex={handleSetCurrentIndex}
                                    currentIndex={currentImageIndex || 0}
                                    url={`/forms/submission/instanceId/${diplayedFiles[0].itemId}`}
                                    urlLabel={MESSAGES.formSubmissionLinkLabel}
                                    getExtraInfos={() =>
                                        ExtraInfoComponent({
                                            instanceDetail: currentInstance,
                                        })
                                    }
                                />
                            )}

                            <TablePagination
                                rowsPerPageOptions={[rowsPerPage]}
                                component="div"
                                count={instancesFilesCount?.[tab] || 0}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    )}
                </>
            )}
        </Box>
    );
};
