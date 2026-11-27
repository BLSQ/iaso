import React, { FC } from 'react';
import { djangoStaticUrl } from 'Iaso/utils/djangoStaticUrl';
import { LogoSvg } from './LogoSvg';

type Props = {
    isIaso: boolean;
    logoPath: string;
};

export const Logo: FC<Props> = ({ isIaso = true, logoPath = '' }) => {
    return isIaso ? (
        <LogoSvg />
    ) : (
        <img
            alt="logo"
            src={djangoStaticUrl(logoPath)}
            style={{ maxHeight: '50px', maxWidth: '200px' }}
        />
    );
};
