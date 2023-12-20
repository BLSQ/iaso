import React, { FunctionComponent, useMemo } from 'react';
import { makeStyles } from '@mui/styles';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import { OrgUnitShape, OrgUnitMarker } from '../types/locations';

type Props = {
    location: OrgUnitMarker | OrgUnitShape;
};

const getParents = (
    location: OrgUnitMarker | OrgUnitShape | OrgUnit,
    parents: Array<string>,
): Array<string> => {
    let newParents = [...parents];

    if (location.parent) {
        newParents.push(location.parent.name);
        if (location.parent.parent) {
            newParents = getParents(location.parent, newParents);
        }
    }
    return newParents;
};

export const useStyles = makeStyles(() => ({
    separator: {
        top: '-2px',
        position: 'relative',
    },
}));

export const OrgUnitPath: FunctionComponent<Props> = ({ location }) => {
    const parentsArray = useMemo(
        () => getParents(location, []).reverse(),
        [location],
    );
    const classes = useStyles();
    return (
        <span>
            {parentsArray.map((parentName: string, index: number) => {
                return (
                    <span key={parentName}>
                        {index > 0 && (
                            <span className={classes.separator}>{` > `}</span>
                        )}
                        {parentName}
                    </span>
                );
            })}
        </span>
    );
};
