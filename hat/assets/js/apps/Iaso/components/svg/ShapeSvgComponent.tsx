import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

function ShapeSvg(props) {
    const finalProps = {
        ...props,
        viewBox: '-5 -5 55 55',
    };
    return (
        <SvgIcon {...finalProps}>
            <path d="M46,14V2H34V6H14V2H2V14H6V34H2V46H14V42H34v4H46V34H42V14ZM6,6h4v4H6Zm4,36H6V38h4Zm24-4H14V34H10V14h4V10H34v4h4V34H34Zm8,4H38V38h4ZM38,10V6h4v4Z" />
        </SvgIcon>
    );
}

export default ShapeSvg;
