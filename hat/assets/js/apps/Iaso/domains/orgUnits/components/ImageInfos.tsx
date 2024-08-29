import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { FavButton } from '../../../components/files/FavButton';
import { ShortFile } from '../../instances/types/instance';


type ImageInfosProps = {
    file: ShortFile;
    // eslint-disable-next-line no-unused-vars
    onImageFavoriteClick: (imageId: number) => void;
    // eslint-disable-next-line no-unused-vars
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
