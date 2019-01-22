This document provides an easier overview of the test fixtures


## Locations

The IDs of the province, ZS, AS and village are hierarchical:
the village `1111` is in AS `111`, ZS `11` and province `1`.

| ID   | Province | ZS         | AS      | Village       |
|:-----|:---------|:-----------|:--------|:--------------|
| 1111 | Kwilu    | Mosango    | Muluma  | Kisala        |
| 1121 | Kwilu    | Mosango    | Muwanda | Muwando-koso  |
| 1511 | Kwilu    | Yasa Bonga | Yasa    | Bonga Village |
| 1521 | Kwilu    | Yasa Bonga | Pelo    | Pelo Kumbi    |
| 2111 | Kwango   | Boko       | Lonzo   | Munene        |

## Patients

| ID  | Name                 | Village ID |
|:----|:---------------------|:-----------|
| 101 | Henri IV de Bourbon  | 1111       |
| 102 | Marie de Medicis     | 1121       |
| 103 | Louis XIII de France | 1111       |
| 104 | Ana María Mauricia…  | 2111       |
| 105 | Louis XIV de Bourbon | 1111       |

## Cases

| ID | Source        | Patient | Village | Tests       |
|:---|:--------------|:--------|:--------|:------------|
| 1  | historic      | 101     | 1111    | no test     |
| 2  | historic      | 102     | 1511    | rdt+ maect- |
| 3  | mobile_backup | 103     | 1111    | rdt-        |
| 4  | mobile_backup | 104     | 1121    | catt+       |
| 5  | pv            | 101     | 1111    | ge+ pl_stg1 |

## Users

| Username           | Super | Scope  | Permissions |
|:-------------------|:------|:-------|:------------|
| root               | Yes   |        | -           |
| admin              | Yes   |        |             |
| supervisor         |       |        |             |
| supervisor-kwilu   |       | Prov:1 |             |
| supervisor-mosango |       | ZS:11  |             |
| supervisor-muluma  |       | AS:111 |             |
| importer           |       |        |             |
| full-exporter      |       |        |             |
| anon-exporter      |       |        |             |
