import React, { FC } from 'react';
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
            src={`${window.STATIC_URL}${logoPath}`}
            style={{ maxHeight: '50px', maxWidth: '200px' }}
        />
    );
};
