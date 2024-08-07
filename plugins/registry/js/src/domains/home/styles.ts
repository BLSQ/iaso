import { SxStyles } from '../../../../../../hat/assets/js/apps/Iaso/types/general';

const absoluteStyle = {
    boxSizing: 'border-box',
    position: 'absolute',
    borderRadius: '100%',
};

const boxRadius = '20%';
const fontFamily = 'Work Sans, sans-serif';
export const primaryColor = '#0B9BF9';
export const secondaryColor = '#E36178';
const whiteColor = '#fff';
const blackColor = '#111111';
const lightGrayColor = '#E0EBEE';
const darkGrayColor = '#1C3B5F';
const blurFilter = 'blur(17px)';
const transitionEffect = '0.3s ease';
const fontSize = '1.35vw';
const mobileFontSize = '18px';
const breakpoint = 600;

export const styles: SxStyles = {
    background: {
        position: 'fixed',
        width: '100vw',
        height: '120vh',
        background: '#F1F3F8',
        zIndex: 1,
    },
    ellipse1: {
        ...absoluteStyle,
        width: '1583px',
        height: '1583px',
        left: '-638px',
        top: '-690px',
        border: '1px solid rgba(95, 28, 74, 0.1)',
    },
    ellipse2: {
        ...absoluteStyle,
        width: '499px',
        height: '499px',
        left: '-96px',
        top: '-148px',
        border: `1px solid ${lightGrayColor}`,
    },
    ellipse3: {
        ...absoluteStyle,
        width: '2139px',
        height: '2139px',
        left: '-916px',
        top: '-968px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
    },
    ellipse4: {
        ...absoluteStyle,
        width: '1059px',
        height: '1059px',
        left: '-376px',
        top: '-428px',
        border: `27px solid #E4F3FE`,
        filter: blurFilter,
    },
    ellipse5: {
        ...absoluteStyle,
        width: '725px',
        height: '725px',
        left: '-209px',
        top: '-261px',
        border: `1px solid ${lightGrayColor}`,
    },
    round1: {
        ...absoluteStyle,
        width: '12px',
        height: '12px',
        left: '20px',
        top: '310px',
        background: '#86386E',
    },
    round2: {
        ...absoluteStyle,
        width: '12px',
        height: '12px',
        left: '474px',
        top: '255px',
        background: '#E38061',
    },
    round3: {
        ...absoluteStyle,
        width: '12px',
        height: '12px',
        left: '389px',
        top: '33px',
        background: primaryColor,
    },
    container: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        zIndex: 2,
        overflow: 'auto',
    },
    blueBox: {
        background: primaryColor,
        width: '100%',
        padding: '4vw 6vw 0 8vw',
        fontSize: '1.95vw',
        lineHeight: '1.3',
        borderRadius: '30px',
        color: whiteColor,
        fontWeight: 400,
        fontFamily,
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: '20px',
        },
    },
    whiteBox: {
        background: whiteColor,
        width: '100%',
        padding: '4vw 8vw',
        borderRadius: '30px',
        fontFamily,
        fontSize,
        lineHeight: '1.3',
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: mobileFontSize,
        },
    },
    title: {
        fontSize: '5.7vw',
        fontWeight: 500,
        lineHeight: '1',
        color: darkGrayColor,
        fontFamily,
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: '7.8vw',
            width: '100%',
            textAlign: 'center',
        },
    },
    link: {
        display: 'block',
        padding: '4vw 0',
        '& a': {
            color: whiteColor,
            borderRadius: '25px',
            textDecoration: 'none',
            padding: '14px 20px',
            width: 'fit-content',
            fontSize,
            lineHeight: '1.3',
            background: secondaryColor,
            transition: `background-color ${transitionEffect}`,
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
                background: '#cc556a',
            },
            [`@media (max-width: ${breakpoint}px)`]: {
                fontSize: mobileFontSize,
            },
        },
    },
    arrow: {
        marginLeft: '10px',
        fontSize: '2.4vw',
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: '25px',
        },
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: '4vw',
        '& span': {
            fontFamily,
            fontSize: '0.97vw',
            fontWeight: 400,
            lineHeight: '24px',
            textAlign: 'left',
            fontStyle: 'italic',
            [`@media (max-width: ${breakpoint}px)`]: {
                fontSize: '12px',
                lineHeight: '18px',
            },
        },
        [`@media (max-width: ${breakpoint}px)`]: {
            paddingBottom: '30px',
        },
    },
    logo: {
        width: '120px',
        height: '120px',
        borderRadius: boxRadius,
        overflow: 'hidden',
        backgroundColor: '#f7f7f7',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        marginRight: '20px',
        flexShrink: 0,
        flexGrow: 0,
        aspectRatio: '1 / 1',
        '& img': {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
        },
    },
    content: {
        width: '100%',
        padding: '5vw',
    },
    boxLinkContainer: {
        marginTop: '4vw',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        '& a': {
            color: 'inherit',
            textDecoration: 'none',
        },
        [`@media (max-width: ${breakpoint}px)`]: {
            marginTop: '30px',
        },
    },
    boxLink: {
        width: '13vw',
        height: '13vw',
        borderRadius: boxRadius,
        overflow: 'hidden',
        marginRight: '10px',
        flexShrink: 0,
        flexGrow: 0,
        transition: `box-shadow ${transitionEffect}, transform ${transitionEffect}`,
        color: whiteColor,
        [`@media (max-width: ${breakpoint}px)`]: {
            width: 'calc(50vw - 25px)',
            height: 'calc(50vw - 25px)',
        },
        '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
            transform: 'scale(1.05)',
        },
        '& div': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '0 10%',
            flexDirection: 'column',
            fontFamily,
            fontSize: '1vw',
            lineHeight: '1.3',
            textAlign: 'center',
            '& svg': {
                fontSize: '2.5vw',
                marginBottom: '1vw',
                [`@media (max-width: ${breakpoint}px)`]: {
                    fontSize: '22px',
                },
            },
            [`@media (max-width: ${breakpoint}px)`]: {
                fontSize: '14px',
            },
        },
    },
    footer: {
        background: whiteColor,
        width: '100%',
        padding: '4vw 6vw',
    },
    footerText: {
        fontFamily,
        fontSize: '0.97vw',
        fontWeight: 400,
        lineHeight: '24px',
        textAlign: 'left',
        color: blackColor,
        width: '19vw',
        '& a': {
            color: blackColor,
            textDecoration: 'underline',
            marginLeft: '10px',
        },
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: '14px',
            width: '100%',
        },
    },
    footerBox: {
        marginTop: '20px',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        '& a': {
            color: 'inherit',
            textDecoration: 'none',
        },
    },
    footerTitle: {
        fontFamily,
        fontSize,
        fontWeight: 400,
        lineHeight: '24px',
        textAlign: 'left',
        [`@media (max-width: ${breakpoint}px)`]: {
            fontSize: mobileFontSize,
        },
    },
    footerBoxImage: {
        width: '11.274vw',
        height: '11.274vw',
        borderRadius: boxRadius,
        border: `1px solid #0000001A`,
        overflow: 'hidden',
        backgroundColor: whiteColor,
        marginRight: '10px',
        flexShrink: 0,
        flexGrow: 0,
        aspectRatio: '1 / 1',
        padding: '0 15%',
        transition: `box-shadow ${transitionEffect}, transform ${transitionEffect}`,
        '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            transform: 'scale(1.05)',
        },
        '& img': {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
        },
        [`@media (max-width: ${breakpoint}px)`]: {
            width: 'calc(50vw - 25px)',
            height: 'calc(50vw - 25px)',
        },
    },
};
