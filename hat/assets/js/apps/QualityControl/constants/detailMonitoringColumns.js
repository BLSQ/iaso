import React from 'react';
import { FormattedDate } from 'react-intl';

import ImgModal from '../../../components/ImgModal';


const detailMonitoringColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'monitoring.label.createdAt',
            }),
            className: 'small',
            accessor: 'created_at',
            Cell: settings => (<FormattedDate value={new Date(settings.original.created_at)} />),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse terrain',
                id: 'monitoring.label.fieldAnswer',
            }),
            accessor: 'result',
            className: 'small',
            Cell: settings => (
                <span>
                    <strong>{settings.original.result}</strong>
                    <br />({settings.original.tester})
                </span>
            ),

        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse coordination',
                id: 'monitoring.label.coordinationAnswer',
            }),
            accessor: 'check_20_result',
            className: 'small',
            Cell: settings => (
                <span>
                    <strong>{settings.original.check_20_result} </strong>
                    <br />
                    <span>{`${settings.original.check_20_validator ? settings.original.check_20_validator : '--'}`} </span>
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Réponse central',
                id: 'monitoring.label.centralAnswer',
            }),
            accessor: 'check_30_result',
            className: 'small',
            Cell: settings => (
                <span>
                    <strong>{settings.original.check_30_result} </strong> <br /> <span>{`${settings.original.check_30_validator ? settings.original.check_30_validator : '--'}`} </span>
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Media',
                id: 'monitoring.label.media',
            }),
            className: 'small',
            accessor: 'media_url',
            Cell: (settings) => {
                if (settings.original.media_type === 'image') {
                    return (
                        <div style={{ maxWidth: '100px', maxHeight: '100px' }}>
                            <ImgModal
                                imgPath={settings.original.media_url}
                                smallPreview
                                altText={formatMessage({
                                    defaultMessage: 'Résultat test dépistage',
                                    id: 'main.screening.result',
                                })}
                            />
                        </div>);
                }
                return (
                    <a href={settings.original.media_url} onClick={() => window.open(settings.original.media_url)}>
                        {formatMessage({
                            defaultMessage: 'Voir la vidéo',
                            id: 'main.label.seeVidei',
                        })}
                    </a>
                );
            },
        },
    ]
);
export default detailMonitoringColumns;
