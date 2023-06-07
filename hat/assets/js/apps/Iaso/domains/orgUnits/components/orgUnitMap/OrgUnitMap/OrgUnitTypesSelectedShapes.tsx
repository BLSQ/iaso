import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { useSafeIntl } from 'bluesquare-components';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';
import { orgunitsPane } from './OrgUnitMap';
import MESSAGES from '../../../messages';
import { SourceShape } from './SourceShape';
import { OrgunitType } from '../../../types/orgunitTypes';
import { MappedOrgUnit } from './types';
import { OrgUnit } from '../../../types/orgUnit';

type Props = {
    orgUnitTypes: (OrgunitType & { color: string })[];
    mappedOrgUnitTypesSelected: MappedOrgUnit[];
    mappedSourcesSelected: MappedOrgUnit[];
    // eslint-disable-next-line no-unused-vars
    fetchSubOrgUnitDetail: (orgUnit: OrgUnit) => void;
    // eslint-disable-next-line no-unused-vars
    updateOrgUnitLocation: (orgUnit: OrgUnit) => void;
};

export const OrgUnitTypesSelectedShapes: FunctionComponent<Props> = ({
    orgUnitTypes,
    mappedOrgUnitTypesSelected,
    mappedSourcesSelected,
    fetchSubOrgUnitDetail,
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
                                        eventHandlers={{
                                            click: () =>
                                                fetchSubOrgUnitDetail(o),
                                        }}
                                        // @ts-ignore TODO: fix this type problem
                                        style={() => ({
                                            color: ot.color,
                                        })}
                                    >
                                        <OrgUnitPopupComponent
                                            titleMessage={formatMessage(
                                                MESSAGES.ouChild,
                                            )}
                                            displayUseLocation
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
                                        onClick={() => {
                                            fetchSubOrgUnitDetail(o);
                                        }}
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
