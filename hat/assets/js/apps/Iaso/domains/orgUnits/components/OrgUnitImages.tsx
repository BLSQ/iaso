import { Paper } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import { SxStyles } from '../../../types/general';
import { useCheckUserHasWritePermissionOnOrgunit } from '../../../utils/usersUtils';
import { useGetImages } from '../../forms/hooks/useGetImages';
import { ShortFile } from '../../instances/types/instance';
import { useSaveOrgUnit } from '../hooks';
import MESSAGES from '../messages';
import { OrgUnit } from '../types/orgUnit';
import { ImageInfos } from './ImageInfos';

type Props = {
    params: Record<string, any>;
    orgUnit?: OrgUnit;
    isFetchingDetail: boolean;
};

const styles: SxStyles = {
    noResult: {
        padding: theme => theme.spacing(2),
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
};

export const OrgUnitImages: FunctionComponent<Props> = ({
    params,
    orgUnit,
    isFetchingDetail,
}) => {
    const [viewerIsOpen, setViewerIsOpen] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveOu, isLoading: savingOu } = useSaveOrgUnit(null, [
        'currentOrgUnit',
    ]);
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
    const isDefaultImage = useCallback(
        (imageId: number) => {
            return imageId === orgUnit?.default_image_id;
        },
        [orgUnit?.default_image_id],
    );
    const handleImageFavoriteClick = useCallback(
        (imageId: number) => {
            saveOu({
                id: params.orgUnitId,
                default_image_id: isDefaultImage(imageId) ? null : imageId,
            });
        },
        [saveOu, params.orgUnitId, isDefaultImage],
    );

    const isLoading = savingOu || isLoadingFiles || isFetchingDetail;
    const getExtraInfos = useCallback(
        (file: ShortFile) => (
            <ImageInfos
                file={file}
                onImageFavoriteClick={handleImageFavoriteClick}
                isDefaultImage={isDefaultImage}
                isLoading={isLoading}
            />
        ),
        [handleImageFavoriteClick, isDefaultImage, isLoading],
    );

    const hasWritePermission = useCheckUserHasWritePermissionOnOrgunit(
        orgUnit?.org_unit_type_id,
    );
    return (
        <>
            {isLoading && <LoadingSpinner />}
            {!isLoadingFiles && files?.length === 0 && (
                <Paper sx={styles.noResult} elevation={2}>
                    {formatMessage(MESSAGES.noResult)}
                </Paper>
            )}
            {orgUnit && !isLoadingFiles && (
                <LazyImagesList
                    imageList={files ?? []}
                    onImageClick={index => handleOpenLightbox(index)}
                    onImageFavoriteClick={
                        hasWritePermission
                            ? handleImageFavoriteClick
                            : undefined
                    }
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
