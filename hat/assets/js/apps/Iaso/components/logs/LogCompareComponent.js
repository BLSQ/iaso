import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getPolygonPositionsFromSimplifiedGeom } from '../../utils/orgUnitUtils';

import PolygonMap from '../maps/PolygonMapComponent';

const LogCompareComponent = ({ log, compareLog }) => (
    log.map((l, i) => (
        <table key={l.pk}>
            <tbody>
                <tr>
                    <th>ID</th>
                    <td>{l.pk}</td>
                </tr>
                <tr>
                    <th>
                        <FormattedMessage
                            id="logs.label.model"
                            defaultMessage="Model"
                        />
                    </th>
                    <td>{l.model}</td>
                </tr>
                {
                    Object.keys(l.fields).map((key) => {
                        const currentField = l.fields[key];
                        let isDifferent = false;
                        if (Array.isArray(currentField)) {
                            currentField.forEach((f, index) => {
                                if (f && compareLog[i] && f !== compareLog[i].fields[key][index]) {
                                    isDifferent = true;
                                }
                            });
                        } else {
                            isDifferent = compareLog[i] && compareLog[i].fields[key] !== currentField;
                        }
                        isDifferent = isDifferent && l.pk === compareLog[i].pk && l.model === compareLog[i].model;

                        if (key === 'simplified_geom' && currentField) {
                            const polygonPositions = getPolygonPositionsFromSimplifiedGeom(currentField);
                            return (
                                <tr key={key}>
                                    <th>{key}</th>
                                    <td className={isDifferent ? 'error' : ''}>
                                        <PolygonMap polygonPositions={polygonPositions} />
                                    </td>
                                </tr>
                            );
                        }
                        return (
                            <tr key={key}>
                                <th>{key}</th>
                                <td className={isDifferent ? 'error' : ''}>{currentField && currentField.toString().length > 0 ? currentField.toString() : '--'}</td>
                            </tr>
                        );
                    })
                }
            </tbody>
        </table>
    ))
);

LogCompareComponent.defaultProps = {
    compareLog: [],
};

LogCompareComponent.propTypes = {
    log: PropTypes.array.isRequired,
    compareLog: PropTypes.array,
};

export default LogCompareComponent;
