import React, { ReactElement } from 'react';
import { makeStyles } from '@mui/styles';
import { textPlaceholder, LinkWithLocation } from 'bluesquare-components';
import { OrgUnitLabel } from '../utils';
import { baseUrls } from '../../../constants/urls';

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));

type Props = {
    orgUnit?: Record<string, any>;
    withType?: boolean;
};

// TODO refactor with strings as children of span> or <p>
const OrgUnitDisplay = ({
    orgUnit,
    withType = true,
}: Props): string | ReactElement => {
    const classes = useStyles();
    if (!orgUnit) {
        return textPlaceholder;
    }
    return (
        <LinkWithLocation
            target="_blank"
            className={classes.link}
            to={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
        >
            {OrgUnitLabel({ orgUnit, withType })}
        </LinkWithLocation>
    );
};

export default OrgUnitDisplay;
