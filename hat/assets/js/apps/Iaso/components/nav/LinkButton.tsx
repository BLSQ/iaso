import { Button, ButtonProps } from '@mui/material';
import React, { FunctionComponent, ReactNode } from 'react';
import { LinkProps } from 'react-router-dom';
import { LinkWithLocation } from './LinkWithLocation';

type Props = LinkProps &
    ButtonProps & {
        children: ReactNode;
        className?: string;
        buttonClassName?: string;
    };

export const LinkButton: FunctionComponent<Props> = props => {
    const {
        reloadDocument,
        replace,
        to,
        target,
        state,
        relative,
        unstable_viewTransition,
        preventScrollReset,
        children,
        className,
        buttonClassName,
        ...buttonProps
    } = props;
    return (
        <LinkWithLocation
            className={className}
            reloadDocument={reloadDocument}
            replace={replace}
            to={to}
            target={target}
            state={state}
            relative={relative}
            unstable_viewTransition={unstable_viewTransition}
            preventScrollReset={preventScrollReset}
        >
            <Button
                variant="contained"
                color="primary"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...buttonProps}
                className={buttonClassName}
                onClick={() => null}
            >
                {children}
            </Button>
        </LinkWithLocation>
    );
};
