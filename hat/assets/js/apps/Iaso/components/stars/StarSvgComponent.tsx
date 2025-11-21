import React, { FunctionComponent } from 'react';

type Props = { starColor?: string; starBgColor?: string; starWidth?: string };

const StarSvg: FunctionComponent<Props> = ({
    starColor = '#F3D110',
    starBgColor = 'white',
    starWidth = '20px',
}) => {
    return (
        <svg
            style={{
                width: starWidth,
                height: starWidth,
            }}
        >
            <g data-name="bg-star" className="bg-star">
                <path
                    d="M0,0V19.125H20.20833V0Zm16.26331,19.0625-6.18-3.73-6.18,3.73,1.64-7.03-5.46-4.73,7.19-.61,2.81-6.63,2.81,6.63,7.19.61-5.46,4.73Z"
                    style={{
                        fill: starBgColor,
                    }}
                />
            </g>
            <g data-name="star">
                <path
                    // eslint-disable-next-line max-len
                    d="M20.08333,7.32333l-7.19-.62-2.81-6.62-2.81,6.63-7.19.61,5.46,4.73-1.64,7.03,6.18-3.73,6.18,3.73-1.63-7.03Zm-10,6.16-3.76,2.27,1-4.28-3.32-2.88,4.38-.38,1.7-4.03,1.71,4.04,4.38.38-3.32,2.88,1,4.28Z"
                    style={{
                        fill: starColor,
                    }}
                />
            </g>
        </svg>
    );
};

export default StarSvg;
