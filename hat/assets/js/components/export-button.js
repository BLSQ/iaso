import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import XLSX from 'xlsx';

//
// given a list of objects transforms it in a xlsx/csv blob
// and creates the link to download
//

// taken from
// https://github.com/eHealthAfrica/angular-eha.excel-export/blob/master/src/excel-export.factory.js
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; i += 1) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

// Converts an array of data into the cell format,
// that has column (c), row (r), value (v) and type (t)
// also figures out number of rows and cols of the doc,
// and writes that as the range
function sheetFromArrayOfArrays(data) {
    const worksheet = {};
    const range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };

    for (let row = 0; row !== data.length; row += 1) {
        for (let col = 0; col !== data[row].length; col += 1) {
            if (range.s.r > row) {
                range.s.r = row;
            }
            if (range.s.c > col) {
                range.s.c = col;
            }
            if (range.e.r < row) {
                range.e.r = row;
            }
            if (range.e.c < col) {
                range.e.c = col;
            }

            const cell = { v: data[row][col] };
            if (cell.v === null) {
                continue;
            }

            const cellRef = XLSX.utils.encode_cell({ c: col, r: row });

            // Type conversion should have been done in the row-reading function
            if (typeof cell.v === 'number') {
                cell.t = 'n';
            } else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            } else if (cell.v instanceof Date) {
                cell.t = 'n';
                const tempCellZ = XLSX.SSF._table[14];
                cell.z = tempCellZ;
                cell.v = window.datenum(cell.v);
            } else {
                cell.t = 's';
            }

            worksheet[cellRef] = cell;
        }
    }

    if (range.s.c < 10000000) {
        worksheet['!ref'] = XLSX.utils.encode_range(range);
    }

    return worksheet;
}

const isXLSXPossible = (window.ArrayBuffer && window.Uint8Array);

class ExportButton extends Component {
    render() {
        const { formatMessage, formatDate } = this.props.intl;
        const {
            data, columns, messages, className,
        } = this.props;

        const filename = this.props.filename || 'data';
        const format = (isXLSXPossible && this.props.format === 'xlsx' ? 'xlsx' : 'csv');

        const toCsv = (list) => {
            const sep = this.props.sep || ',';
            const WRAP_STR = '"';

            const headers = columns.map(col =>
                WRAP_STR + formatMessage(messages[col.message]) + WRAP_STR).join(sep);

            const rows = list.map(row => (
                columns.map((col) => {
                    const val = row[col.key] || '';
                    switch (col.type) {
                        case 'number':
                            return val;
                        case 'date':
                            return (val !== '' ? WRAP_STR + formatDate(val) + WRAP_STR : val);
                        case 'message':
                            return WRAP_STR + (messages[val] ?
                                formatMessage(messages[val]) : val) + WRAP_STR;
                        default:
                            return WRAP_STR + val + WRAP_STR;
                    }
                }).join(sep)
            ));

            return [headers].concat(rows).join('\n');
        };

        const toExcel = (list) => {
            const table = [];

            table.push(columns.map(col => formatMessage(messages[col.message])));

            list.forEach((row) => {
                table.push(columns.map((col) => {
                    const val = row[col.key] || '';
                    switch (col.type) {
                        case 'message':
                            return (messages[val] ? formatMessage(messages[val]) : val);
                        default:
                            return val;
                    }
                }));
            });

            const workBook = {
                SheetNames: [filename],
                Sheets: {},
            };
            workBook.Sheets[filename] = sheetFromArrayOfArrays(table);

            const write = XLSX.write(workBook, {
                bookType: 'xlsx',
                bookSST: true,
                type: 'binary',
            });

            return s2ab(write);
        };

        const toFormat = (format === 'xlsx' ? toExcel : toCsv);

        if (data && data.length) {
            const blob = new window.Blob([toFormat(data)], {
                encoding: 'UTF-8',
                type: (format === 'xlsx'
                    ? 'application/vnd.ms-excel'
                    : 'text/csv;charset=UTF-8'),
            });
            const blobUrl = window.URL.createObjectURL(blob);
            const name = `${filename}-${new Date().toISOString()}.${format}`;

            return (
                <a href={blobUrl} download={name} className={className || 'button'}>
                    <i className="fa fa-download" />
                    {this.props.children}
                </a>
            );
        }
        return <div />;
    }
}
ExportButton.defaultProps = {
    data: [],
    columns: [],
    messages: undefined,
    format: '',
    sep: '',
    filename: '',
    className: '',
};


ExportButton.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    columns: PropTypes.arrayOf(PropTypes.object),
    messages: PropTypes.object,
    format: PropTypes.string,
    sep: PropTypes.string,
    filename: PropTypes.string,
    className: PropTypes.string,
    intl: intlShape.isRequired,
    children: PropTypes.node.isRequired,
};

export default injectIntl(ExportButton);
