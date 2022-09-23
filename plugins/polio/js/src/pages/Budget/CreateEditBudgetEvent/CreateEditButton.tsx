import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    AddButton,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import MESSAGES from '../../../constants/messages';

const Edit = ({ onClick, color }: { onClick: () => void; color: string }) => {
    return (
        <IconButtonComponent
            onClick={onClick}
            overrideIcon={AutorenewIcon}
            tooltipMessage={MESSAGES.resendFiles}
            color={color}
        />
    );
};

const style = theme => {
    return {
        addButton: {
            [theme.breakpoints.down('md')]: {
                marginLeft: theme.spacing(1),
            },
        },
    };
};

export const useButtonStyles = makeStyles(style);

const Add = ({
    onClick,
    isMobileLayout,
}: {
    onClick: () => void;
    isMobileLayout: boolean;
}) => {
    const classes = useButtonStyles();
    return (
        // The div prevents the Button from being too big on small screens
        <div className={classes.addButton}>
            <AddButton
                onClick={onClick}
                dataTestId="create-budgetStep-button"
                size="medium"
                message={isMobileLayout ? MESSAGES.add : MESSAGES.addStep}
            />
        </div>
    );
};

type CreateEditButtonProps = {
    type?: 'create' | 'edit' | 'retry';
    isMobileLayout?: boolean;
    color?: string;
    onClick: () => void;
};

export const CreatEditButton: FunctionComponent<CreateEditButtonProps> = ({
    type = 'create',
    isMobileLayout = false,
    color = 'action',
    onClick,
}: CreateEditButtonProps) => {
    if (type === 'edit' || type === 'retry') {
        return <Edit onClick={onClick} color={color} />;
    }

    return <Add onClick={onClick} isMobileLayout={isMobileLayout} />;
};
