import React, { FC } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

const COLORS = {
    stroke: '#9E9E9E',
    strokeLight: '#BDBDBD',
    fillLight: '#E0E0E0',
    ground: '#F2F2F2',
    accent: '#FFC107',
    white: '#FFFFFF',
};

const MAST_TRIANGLES_Y = [45, 105, 165, 225, 285];

type Props = {
    sx?: SxProps<Theme>;
};

export const UnderConstructionIllustration: FC<Props> = ({ sx }) => (
    <Box
        component="svg"
        viewBox="0 0 600 400"
        role="img"
        aria-hidden="true"
        sx={sx}
    >
        <ellipse cx="300" cy="372" rx="295" ry="18" fill={COLORS.ground} />

        <g stroke={COLORS.stroke} strokeLinecap="round" fill="none">
            <line x1="245" y1="15" x2="590" y2="15" strokeWidth="6" />
            <line x1="547" y1="10" x2="547" y2="368" strokeWidth="6" />
            <line x1="484" y1="15" x2="484" y2="132" strokeWidth="3" />
            <path d="M470 140 L484 132 L498 140" strokeWidth="3" />
            {React.Children.toArray(
                MAST_TRIANGLES_Y.map(y => (
                    <path
                        d={`M533 ${y + 30} L547 ${y} L561 ${y + 30} Z`}
                        stroke={COLORS.strokeLight}
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                )),
            )}
        </g>
        <rect
            x="570"
            y="20"
            width="30"
            height="22"
            rx="3"
            fill={COLORS.strokeLight}
        />
        <rect
            x="447"
            y="140"
            width="74"
            height="50"
            rx="6"
            fill={COLORS.ground}
            stroke={COLORS.strokeLight}
            strokeWidth="4"
        />
        <rect
            x="460"
            y="155"
            width="44"
            height="7"
            rx="3.5"
            fill={COLORS.strokeLight}
        />
        <rect
            x="460"
            y="169"
            width="30"
            height="7"
            rx="3.5"
            fill={COLORS.fillLight}
        />

        <rect
            x="168"
            y="75"
            width="265"
            height="285"
            rx="14"
            fill={COLORS.white}
            stroke={COLORS.strokeLight}
            strokeWidth="5"
        />
        <line
            x1="168"
            y1="115"
            x2="433"
            y2="115"
            stroke={COLORS.strokeLight}
            strokeWidth="5"
        />
        <circle cx="192" cy="95" r="6" fill={COLORS.strokeLight} />
        <circle cx="212" cy="95" r="6" fill={COLORS.strokeLight} />
        <circle cx="232" cy="95" r="6" fill={COLORS.strokeLight} />
        <rect
            x="195"
            y="143"
            width="118"
            height="12"
            rx="6"
            fill={COLORS.stroke}
        />
        <rect
            x="195"
            y="173"
            width="208"
            height="8"
            rx="4"
            fill={COLORS.fillLight}
        />
        <rect
            x="195"
            y="197"
            width="168"
            height="8"
            rx="4"
            fill={COLORS.fillLight}
        />
        <rect
            x="195"
            y="232"
            width="210"
            height="95"
            rx="8"
            fill="none"
            stroke={COLORS.fillLight}
            strokeWidth="4"
            strokeDasharray="12 8"
        />
        <path
            d="M300 268 V292 M288 280 H312"
            stroke={COLORS.strokeLight}
            strokeWidth="3"
            strokeLinecap="round"
        />

        <path
            d="M468 307 H490 L500 362 H458 Z"
            fill={COLORS.white}
            stroke={COLORS.stroke}
            strokeWidth="4"
            strokeLinejoin="round"
        />
        <rect x="462" y="333" width="34" height="7" fill={COLORS.accent} />
        <rect
            x="450"
            y="362"
            width="58"
            height="7"
            rx="2"
            fill={COLORS.stroke}
        />

        <path
            d="M95 350 C80 330 55 307 55 287 A40 40 0 0 1 135 287 C135 307 110 330 95 350 Z"
            fill={COLORS.strokeLight}
        />
        <circle cx="95" cy="282" r="12" fill={COLORS.white} />
        <path d="M62 247 A33 33 0 0 1 128 247 Z" fill={COLORS.accent} />
        <g stroke={COLORS.stroke} strokeLinecap="round">
            <line x1="50" y1="247" x2="140" y2="247" strokeWidth="5" />
            <line x1="95" y1="222" x2="95" y2="234" strokeWidth="3" />
        </g>

        <g
            stroke={COLORS.strokeLight}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
        >
            <line x1="33" y1="152" x2="31" y2="165" />
            <line x1="38" y1="173" x2="31" y2="180" />
            <line x1="45" y1="189" x2="56" y2="187" />
            <path d="M132 340 Q145 346 160 342" strokeDasharray="8 6" />
        </g>
    </Box>
);
