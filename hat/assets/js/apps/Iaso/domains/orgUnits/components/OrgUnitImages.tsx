import { Box, Typography } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import { useGetImages } from '../../forms/hooks/useGetImages';
import { ShortFile } from '../../instances/types/instance';
import { useSaveOrgUnit } from '../hooks';
import { OrgUnit } from '../types/orgUnit';

type Props = {
    params: Record<string, any>;
    orgUnit?: OrgUnit;
};

const ExtraInfos: FunctionComponent<{ file: ShortFile }> = ({ file }) => {
    return (
        <Box>
            <Typography variant="body2" color="primary">
                {file?.file_type}
            </Typography>
        </Box>
    );
};

export const OrgUnitImages: FunctionComponent<Props> = ({
    params,
    orgUnit,
}) => {
    const [viewerIsOpen, setViewerIsOpen] = useState<boolean>(false);

    const { mutateAsync: saveOu, isLoading: savingOu } = useSaveOrgUnit();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { data: files, isLoading: isLoadingFiles } = useGetImages({
        orgUnitId: params.orgUnitId,
    });
    const handleOpenLightbox = index => {
        setCurrentImageIndex(index);
        setViewerIsOpen(true);
    };

    const handleCloseLightbox = () => {
        setCurrentImageIndex(0);
        setViewerIsOpen(false);
    };

    const getExtraInfos = useCallback(
        (file: ShortFile) => <ExtraInfos file={file} />,
        [],
    );
    const isLoading = savingOu || isLoadingFiles;
    const isDefaultImage = useCallback(
        (imageId: number) => {
            return imageId === orgUnit?.default_image?.id;
        },
        [orgUnit?.default_image?.id],
    );
    const handleImageFavoriteClick = useCallback(
        (imageid: number) => {
            saveOu({
                id: params.orgUnitId,
                default_image: isDefaultImage(imageid) ? null : imageid,
            });
        },
        [saveOu, params.orgUnitId, isDefaultImage],
    );

    return (
        <>
            {isLoading && <LoadingSpinner />}
            {!isLoadingFiles && files?.length === 0 && 'NO IMAGES'}
            {!isLoadingFiles && (
                <LazyImagesList
                    imageList={files ?? []}
                    onImageClick={index => handleOpenLightbox(index)}
                    onImageFavoriteClick={handleImageFavoriteClick}
                    isDefaultImage={isDefaultImage}
                />
            )}
            {files && viewerIsOpen && (
                <ImageGallery
                    imageList={files}
                    closeLightbox={handleCloseLightbox}
                    currentIndex={currentImageIndex}
                    setCurrentIndex={newIndex => setCurrentImageIndex(newIndex)}
                    getExtraInfos={getExtraInfos}
                />
            )}
        </>
    );
};
