import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import { OrgUnit } from '../../../types/orgUnit';
import { SourceShape } from './SourceShape';
import { MappedOrgUnit } from './types';

type Props = {
    mappedSourcesSelected: MappedOrgUnit[];
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const SourcesSelectedShapes: FunctionComponent<Props> = ({
    mappedSourcesSelected,
    updateOrgUnitLocation,
}) => {
    return (
        <>
            {mappedSourcesSelected.map(ms => {
                const shapes = ms.orgUnits.shapes.filter(
                    o => !o.org_unit_type_id,
                );
                if (shapes.length > 0) {
                    return (
                        <Pane name={`no-org-unit-type-${ms.id}`} key={ms.id}>
                            {shapes.map(o => (
                                <SourceShape
                                    source={ms}
                                    shape={o}
                                    key={o.id}
                                    replaceLocation={updateOrgUnitLocation}
                                />
                            ))}
                        </Pane>
                    );
                }
                return null;
            })}
        </>
    );
};
