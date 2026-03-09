import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

function PdfSvg(props) {
    const finalProps = {
        ...props,
        viewBox: '0 0 40 40',
    };
    return (
        <SvgIcon {...finalProps}>
            <g>
                <path d="M15.2,3L7,11.6v22.9h25.5V3H15.2z M14.5,6.6v3.8h-3.7L14.5,6.6z M30.5,32.5H9V12.4h7.4V5h14.1V32.5z" />
                <g>
                    <path d="M12.4,28.1L10.7,31H9.4l2.4-4l-2.2-3.9h1.3l1.6,2.7l1.6-2.7h1.3L13,27l2.5,4h-1.3L12.4,28.1z" />
                    <path d="M16.4,23.1h1.1l2.2,5.2l2.2-5.2h1.1V31h-1.2v-4.9h0l-1.6,3.8h-1l-1.6-3.8h0V31h-1.2V23.1z" />
                    <path d="M25,23.1h1.2v6.8H30V31h-5V23.1z" />
                </g>
            </g>
        </SvgIcon>
    );
}

export default PdfSvg;
