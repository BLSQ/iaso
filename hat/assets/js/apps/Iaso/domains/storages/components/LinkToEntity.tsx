import React, { FunctionComponent } from 'react';
import { makeStyles } from '@material-ui/core';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Entity } from '../../entities/types/entity';

const useStyles = makeStyles(theme => ({
    root: {
        textDecoration: 'none',
        color: theme.palette.primary.main,
        '&:hover': {
            textDecoration: 'underline',
        },
    },
}));

type Props = {
    entity: Entity | undefined;
};

export const LinkToEntity: FunctionComponent<Props> = ({ entity }) => {
    const user = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    if (userHasPermission('iaso_entities', user) && entity) {
        const url = `/${baseUrls.entityDetails}/entityId/${entity.id}`;
        return (
            <Link className={classes.root} to={url}>
                {/*  // TODO this will not work as this field is not in use anymore */}
                {entity.name}
            </Link>
        );
    }
    return <>{entity ? entity.name : '-'}</>;
};
