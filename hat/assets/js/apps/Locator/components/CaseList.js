import React from 'react';
import PropTypes from 'prop-types';

const CaseList = ({ list }) => (
    <div>
        <table>
            <thead>
                <tr>
                    <th>Province</th>
                    <th>ZS</th>
                    <th>AS</th>
                    <th>Village</th>
                    <th>Source</th>
                    <th>Unité</th>
                    <th>Année Form.</th>
                    <th>Numéro Form.</th>
                </tr>
            </thead>
            <tbody>
                {
                    list.cases.map(kase => (
                        <tr key={kase.id}>
                            <td>{kase.province}</td>
                            <td>{kase.ZS}</td>
                            <td>{kase.AS}</td>
                            <td>{kase.village}</td>
                            <td>{kase.source}</td>
                            <td>{kase.mobile_unit}</td>
                            <td>{kase.form_year}</td>
                            <td>{kase.form_number}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    </div>
);

CaseList.propTypes = {
    list: PropTypes.object.isRequired,
};

export default CaseList;
