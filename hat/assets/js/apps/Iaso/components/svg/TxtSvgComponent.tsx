import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

function TextSvg(props) {
    const finalProps = {
        ...props,
        viewBox: '-4 -3 40 40',
    };
    return (
        <SvgIcon {...finalProps}>
            <g>
                <path d="M11.2,0L3,8.6v22.9h25.5V0H11.2z M10.5,3.6v3.8H6.8L10.5,3.6z M26.5,29.5H5V9.4h7.4V2h14.1V29.5z" />
                <polygon points="19.1,18.6 21,18.6 21,26.8 22.6,26.8 22.6,18.6 24.4,18.6 24.4,17.2 19.1,17.2 " />
                <polygon points="7.1,18.6 9,18.6 9,26.8 10.6,26.8 10.6,18.6 12.4,18.6 12.4,17.2 7.1,17.2" />
                <polygon
                    points="18.9,17.2 17.2,17.2 15.8,20.5 14.3,17.2 12.6,17.2 14.8,21.8 12.4,26.8 14.1,26.8 15.7,23.1 17.3,26.8
                19.1,26.8 16.7,21.8"
                />
            </g>
        </SvgIcon>
    );
}

export default TextSvg;
