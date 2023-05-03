import React, { FunctionComponent } from 'react';
import { Pane } from 'react-leaflet';
import { OrgUnit } from '../../../types/orgUnit';
import { SourceShape } from './SourceShape';
import { MappedOrgUnit } from './types';

type Props = {
    mappedSourcesSelected: MappedOrgUnit[];
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    fetchSubOrgUnitDetail: (orgUnit: OrgUnit) => void;
};

export const SourcesSelectedShapes: FunctionComponent<Props> = ({
    mappedSourcesSelected,
    updateOrgUnitLocation,
    fetchSubOrgUnitDetail,
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
                                    onClick={() => {
                                        fetchSubOrgUnitDetail(o);
                                    }}
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
