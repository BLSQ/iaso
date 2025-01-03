import classNames from 'classnames';
import React, {
    FunctionComponent,
    useContext,
    useEffect,
    useState,
} from 'react';
import { makeStyles } from '@mui/styles';
import { Home } from './Home';
import { InputContext } from '../../../app/contexts/InputContext';
import PageError from '../../../../components/errors/PageError';
import { Productivity } from './Productivity';

export const useStyles = makeStyles({
    blackBackground: {
        backgroundColor: 'black',
    },
    oldSchoolGreen: {
        color: '#33FF00',
    },
    oldSchoolOrange: {
        color: '#FFB000',
    },
    oldSchoolGrey: {
        color: '#282828',
    },
    fullHeight: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
    },
    border: { border: '2px dashed #33FF00' },
    innerBody: {
        height: 'calc(100vh - 25px)',
        width: 'calc(100vw - 25px)',
        margin: 'auto',
    },
    title: {
        height: '30vh',
        width: '50vw',
        // border: '3px solid #33FF00',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        flex: 1,
        fontSize: 60,
    },
    /* The typing effect */
    '@keyframes typing': {
        from: { width: '0' },
        to: { width: '100%' },
    },

    titleText: {
        overflow:
            'hidden' /* Ensures the content is not revealed until the animation */,
        whiteSpace: 'nowrap' /* Keeps the content on a single line */,
        margin: '0 auto' /* Gives that scrolling effect as the typing happens */,
        animation: `$typing 4s steps(24, end)`,
    },

    '@keyframes blinker': {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    startText: {
        fontSize: 40,
        marginTop: '50px',
        animationName: '$blinker',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
    },
});

const usePressAnyKey = activate => {
    const [keyPressed, setKeyPressed] = useState<boolean>(false);

    useEffect(() => {
        const update = () => {
            if (!keyPressed && activate) setKeyPressed(true);
        };
        document.addEventListener('keydown', update);
        return () => {
            document.removeEventListener('keydown', update);
        };
    });

    return keyPressed;
};

export const Welcome: FunctionComponent = () => {
    const classes = useStyles();
    const { hasInputCode } = useContext(InputContext) as {
        hasInputCode: boolean;
    };
    const [showPage, setShowPage] = useState<boolean>(false);
    const isKeyPressed = usePressAnyKey(showPage);

    useEffect(() => {
        if (hasInputCode) {
            setShowPage(true);
        }
    }, [hasInputCode]);

    if (showPage) {
        return (
            <div
                className={classNames(
                    classes.blackBackground,
                    classes.oldSchoolGreen,
                    classes.fullHeight,
                    classes.border,
                )}
            >
                {!isKeyPressed && <Home />}
                {isKeyPressed && <Productivity />}
            </div>
        );
    }
    return <PageError errorCode="403" />;
};
