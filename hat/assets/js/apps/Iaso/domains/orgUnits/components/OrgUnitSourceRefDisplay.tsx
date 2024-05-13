import React, { ReactElement } from 'react';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'bluesquare-components';
import { LinkWithLocation } from '../../../components/nav/LinkWithLocation';
import { OrgUnit } from '../types/orgUnit';

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));

type Props = {
    orgUnit?: OrgUnit;
};

export const OrgUnitSourceRefDisplay = ({
    orgUnit,
}: Props): string | ReactElement => {
    const classes = useStyles();
    if (!orgUnit || !orgUnit.source_ref) {
        return textPlaceholder;
    }

    return (
        <LinkWithLocation
            target="_blank"
            className={classes.link}
            to={`/${orgUnit.source_url}/api/organisationUnits/${orgUnit.source_ref}`}
        >
            {orgUnit.source_ref}
        </LinkWithLocation>
    );
};
