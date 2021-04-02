import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchList } from '../../../utils/requests';

import SingleTable from '../../../components/tables/SingleTable';
// import DataSourceDialogComponent from './components/DataSourceDialogComponent';
// import AddButtonComponent from '../../../components/buttons/AddButtonComponent';

import { baseUrls } from '../../../constants/urls';

import fomrVersionsTableColumns from '../config';
import { useSafeIntl } from '../../../hooks/intl';

const baseUrl = baseUrls.sources;
const defaultOrder = 'version_id';
const FormVersionsComponent = ({ formId }) => {
    const [forceRefresh, setForceRefresh] = useState(false);
    const dispatch = useDispatch();
    const intl = useSafeIntl();
    return (
        <>
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="formversions"
                exportButtons={false}
                dataKey="form_versions"
                defaultPageSize={20}
                fetchItems={(d, url) =>
                    fetchList(
                        d,
                        `${url}&form_id=${formId}`,
                        'fetchFormVersionsError',
                        'form versions',
                    )
                }
                defaultSorted={[{ id: defaultOrder, desc: false }]}
                columns={fomrVersionsTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                )}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                // extraComponent={
                //     <DataSourceDialogComponent
                //         defaultSourceVersion={defaultSourceVersion}
                //         titleMessage={MESSAGES.createDataSource}
                //         renderTrigger={({ openDialog }) => (
                //             <AddButtonComponent onClick={openDialog} />
                //         )}
                //         onSuccess={() => setForceRefresh(true)}
                //     />
                // }
            />
        </>
    );
};
FormVersionsComponent.propTypes = {
    formId: PropTypes.string.isRequired,
};

export default FormVersionsComponent;
