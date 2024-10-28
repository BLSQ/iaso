import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import MESSAGES from '../../../messages';
import { OrgUnit } from '../../../types/orgUnit';
import { OrgunitType } from '../../../types/orgunitTypes';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';
import { orgunitsPane } from './OrgUnitMap';
import { SourceShape } from './SourceShape';
import { MappedOrgUnit } from './types';

type Props = {
    orgUnitTypes: (OrgunitType & { color: string })[];
    mappedOrgUnitTypesSelected: MappedOrgUnit[];
    mappedSourcesSelected: MappedOrgUnit[];
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const OrgUnitTypesSelectedShapes: FunctionComponent<Props> = ({
    orgUnitTypes,
    mappedOrgUnitTypesSelected,
    mappedSourcesSelected,
    updateOrgUnitLocation,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {orgUnitTypes.map(ot => {
                const selectedOut = mappedOrgUnitTypesSelected.find(
                    mot => mot.id === ot.id,
                );

                const sourcesOrgUnits = mappedSourcesSelected.filter(ms =>
                    ms.orgUnits.shapes.some(o => o.org_unit_type_id === ot.id),
                );
                if (selectedOut || sourcesOrgUnits.length > 0) {
                    return (
                        <Pane
                            style={{
                                zIndex: 400 + (ot.depth || 1),
                            }}
                            name={`${orgunitsPane}-type-${ot.id}-${ot.name}`}
                            key={ot.id}
                        >
                            {selectedOut &&
                                selectedOut.orgUnits.shapes.map(o => (
                                    <GeoJSON
                                        key={o.id}
                                        data={o.geo_json}
                                        style={() => ({
                                            color: ot.color,
                                        })}
                                    >
                                        <OrgUnitPopupComponent
                                            titleMessage={formatMessage(
                                                MESSAGES.ouChild,
                                            )}
                                            displayUseLocation
                                            orgUnitId={o.id}
                                            replaceLocation={selectedOrgUnit =>
                                                updateOrgUnitLocation(
                                                    selectedOrgUnit,
                                                )
                                            }
                                        />
                                    </GeoJSON>
                                ))}

                            {sourcesOrgUnits.map(s =>
                                s.orgUnits.shapes.map(o => (
                                    <SourceShape
                                        source={s}
                                        shape={o}
                                        key={o.id}
                                        replaceLocation={updateOrgUnitLocation}
                                    />
                                )),
                            )}
                        </Pane>
                    );
                }
                return null;
            })}
        </>
    );
};
