import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';

import { Box, Tab, TablePagination, Tabs } from '@mui/material';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import InstanceFileInfoComponent from 'Iaso/domains/instances/components/InstanceFileInfoComponent';
import { useGetInstance } from 'Iaso/domains/registry/hooks/useGetInstances';
import { SxStyles } from 'Iaso/types/general';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import DocumentsList from '../../../components/files/DocumentsListComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import VideosList from '../../../components/files/VideosListComponent';

import MESSAGES from '../messages';
import { useGetInstancesFiles, useGetInstancesFilesCount } from '../requests';
import { Instance, ShortFile } from '../types/instance';
import InstancePopover from './InstancePopoverComponent';

interface ExtraInfoComponentProps {
    instanceDetail?: Instance;
}

const ExtraInfoComponent: React.FC<ExtraInfoComponentProps> = ({
    instanceDetail,
}) => <InstancePopover instanceDetail={instanceDetail} />;

const InfoComponent = ({ filePath, instanceDetail }) => {
    if (instanceDetail == null) {
        return null;
    }
    return (
        <InstanceFileInfoComponent
            filePath={filePath}
            instanceDetail={instanceDetail}
        />
    );
};

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

interface PaginatedInstancesFilesListProps {
    params: Record<string, string>;
    updateParams: (params: Record<string, string | undefined>) => void;
}

export const PaginatedInstancesFilesList: FunctionComponent<
    PaginatedInstancesFilesListProps
> = ({ params, updateParams }) => {
    const { formatMessage } = useSafeIntl();

    const rowsPerPage = params?.fileRowsPerPage
        ? parseInt(params.fileRowsPerPage, 10)
        : DEFAULT_FILES_PER_PAGES;
    const page = params?.filePage ? parseInt(params.filePage, 10) : 0;

    const [viewerIsOpen, setViewerIsOpen] = useState<boolean>(false);
    const [tab, setTab] = useState<'images' | 'videos' | 'docs' | 'others'>(
        'images',
    );
    const [currentInstanceId, setCurrentInstanceId] = useState<
        number | undefined
    >();
    const [currentImageIndex, setCurrentImageIndex] = useState<
        number | undefined
    >(undefined);

    const { data: instancesFilesCount } = useGetInstancesFilesCount(params);
    const { data: currentInstance } = useGetInstance(currentInstanceId);

    const handleChangePage = useCallback(
        (
            _event: React.MouseEvent<HTMLButtonElement> | null,
            newPage: number,
        ) => {
            updateParams({ ...params, filePage: newPage.toString() });
        },
        [params, updateParams],
    );

    const handleChangeRowsPerPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const displayedFiles = useMemo(() => {
        if (loadingFiles) {
            return [];
        }
        return files?.results || [];
    }, [loadingFiles, files]);

    const handleChangeTab = useCallback(
        (newTab: 'images' | 'videos' | 'docs' | 'others') => {
            updateParams({ ...params, filePage: '0' });
            setTab(newTab);
        },
        [params, updateParams],
    );

    const handleSetCurrentIndex = useCallback(
        (fileIndex?: number) => {
            if (fileIndex !== undefined) {
                const instanceId = displayedFiles[fileIndex]?.itemId;
                if (instanceId) {
                    setCurrentInstanceId(instanceId);
                }
            }
            setCurrentImageIndex(fileIndex);
        },
        [displayedFiles],
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
    }, [handleSetCurrentIndex]);

    const handleDocumentsClicked = useCallback(
        (filePath: string) => {
            const file = displayedFiles.find(f => {
                return f.path == filePath;
            });
            if (file != null) {
                setCurrentInstanceId(file.itemId);
            }
            return InfoComponent({
                filePath,
                instanceDetail: currentInstance,
            });
        },
        [currentInstance, displayedFiles],
    );

    const currentInstanceUrl = currentInstance
        ? `/forms/submission/instanceId/${currentInstance.id}`
        : undefined;

    return (
        <Box sx={styles.root}>
            <Tabs
                variant="fullWidth"
                indicatorColor="primary"
                value={tab}
                onChange={(_event, newTab) => handleChangeTab(newTab)}
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
                            MESSAGES[type as keyof typeof MESSAGES],
                        )} (${instancesFilesCount?.[type as keyof typeof instancesFilesCount] || 0})`}
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
                    {displayedFiles.length === 0 && (
                        <Box p={2}>{formatMessage(MESSAGES.missingFile)}</Box>
                    )}
                    {displayedFiles.length > 0 && (
                        <>
                            <Box
                                sx={
                                    tab !== 'images'
                                        ? styles.hiddenImages
                                        : styles.images
                                }
                            >
                                <LazyImagesList
                                    imageList={displayedFiles}
                                    onImageClick={handleOpenLightbox}
                                />
                            </Box>
                            {tab === 'videos' && (
                                <Box sx={styles.tabContainer} mt={2}>
                                    <VideosList videoList={displayedFiles} />
                                </Box>
                            )}
                            {tab === 'docs' && (
                                <Box sx={styles.tabContainer}>
                                    <DocumentsList
                                        docsList={displayedFiles}
                                        url={currentInstanceUrl}
                                        urlLabel={
                                            MESSAGES.formSubmissionLinkLabel
                                        }
                                        getInfos={(filePath: string) =>
                                            handleDocumentsClicked(filePath)
                                        }
                                        getExtraInfos={() =>
                                            ExtraInfoComponent({
                                                instanceDetail: currentInstance,
                                            })
                                        }
                                    />
                                </Box>
                            )}
                            {tab === 'others' && (
                                <Box sx={styles.tabContainer}>
                                    <DocumentsList
                                        docsList={displayedFiles}
                                        url={currentInstanceUrl}
                                        urlLabel={
                                            MESSAGES.formSubmissionLinkLabel
                                        }
                                        getInfos={(filePath: string) =>
                                            handleDocumentsClicked(filePath)
                                        }
                                        getExtraInfos={() =>
                                            ExtraInfoComponent({
                                                instanceDetail: currentInstance,
                                            })
                                        }
                                    />
                                </Box>
                            )}
                            {viewerIsOpen && (
                                <ImageGallery
                                    imageList={displayedFiles}
                                    closeLightbox={handleCloseLightbox}
                                    setCurrentIndex={handleSetCurrentIndex}
                                    currentIndex={currentImageIndex || 0}
                                    url={currentInstanceUrl}
                                    urlLabel={MESSAGES.formSubmissionLinkLabel}
                                    getInfos={(file: ShortFile) =>
                                        InfoComponent({
                                            filePath: file.path,
                                            instanceDetail: currentInstance,
                                        })
                                    }
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
