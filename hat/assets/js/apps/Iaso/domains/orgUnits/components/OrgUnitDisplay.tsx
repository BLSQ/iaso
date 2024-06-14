import { makeStyles } from '@mui/styles';
import { LinkWithLocation, textPlaceholder } from 'bluesquare-components';
import React, { ReactElement } from 'react';
import { baseUrls } from '../../../constants/urls';
import { OrgUnit } from '../types/orgUnit';
import { OrgUnitLabel } from './OrgUnitLabel';

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));

type Props = {
    orgUnit?: OrgUnit;
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
            className={classes.link}
            to={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
        >
            <OrgUnitLabel orgUnit={orgUnit} withType={withType} />
        </LinkWithLocation>
    );
};

export default OrgUnitDisplay;
