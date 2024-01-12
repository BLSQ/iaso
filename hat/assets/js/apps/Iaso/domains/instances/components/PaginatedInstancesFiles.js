// A bit higher limit than for table since we display a grid
import { LoadingSpinner } from 'bluesquare-components';
import PropTypes from 'prop-types';
import React from 'react';
import { TablePagination } from '@mui/material';
import InstancesFilesList from './InstancesFilesListComponent';
import { useGetInstancesFiles } from '../requests';

const DEFAULT_FILES_PER_PAGES = 100;
export const PaginatedInstanceFiles = ({ params, updateParams }) => {
    const page = params?.filePage ? parseInt(params.filePage, 10) : 0;
    const rowsPerPage = params?.fileRowsPerPage
        ? parseInt(params.fileRowsPerPage, 10)
        : DEFAULT_FILES_PER_PAGES;
    const { data: instancesFiles, isLoading: loadingFiles } =
        useGetInstancesFiles(params, rowsPerPage, page);

    const handleChangePage = (_event, newPage) => {
        updateParams({ ...params, filePage: newPage });
    };
    const handleChangeRowsPerPage = event => {
        const newRowsPerPage = event.target.value;
        updateParams({
            ...params,
            filePage: undefined,
            fileRowsPerPage: newRowsPerPage,
        });
    };
    return (
        <>
            {loadingFiles && <LoadingSpinner />}
            <InstancesFilesList
                files={instancesFiles?.results}
                fetching={loadingFiles}
            />
            {instancesFiles?.count > 0 && (
                <TablePagination
                    rowsPerPageOptions={[20, 50, 100, 200, 500]}
                    component="div"
                    count={instancesFiles.count}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    // labelRowsPerPage="Results"
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            )}
        </>
    );
};

PaginatedInstanceFiles.propTypes = {
    params: PropTypes.shape({
        // In addition to the search params
        fileRowsPerPage: PropTypes.string,
        filePage: PropTypes.string,
    }).isRequired,
    updateParams: PropTypes.func.isRequired,
};
