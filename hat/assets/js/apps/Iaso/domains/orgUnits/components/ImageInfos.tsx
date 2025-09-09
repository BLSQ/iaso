import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { FavButton } from '../../../components/files/FavButton';
import { ShortFile } from '../../instances/types/instance';

type ImageInfosProps = {
    file: ShortFile;
    onImageFavoriteClick: (imageId: number) => void;
    isDefaultImage: (imageId: number) => boolean;
    isLoading: boolean;
};

export const ImageInfos: FunctionComponent<ImageInfosProps> = ({
    file,
    onImageFavoriteClick,
    isDefaultImage,
    isLoading,
}) => {
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <FavButton
                file={file}
                onImageFavoriteClick={onImageFavoriteClick}
                isDefaultImage={isDefaultImage}
            />
        </>
    );
};
