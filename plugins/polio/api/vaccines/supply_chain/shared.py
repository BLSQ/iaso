from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm


class VaccineSupplyChainReadWritePerm(GenericReadWritePerm):
    read_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_READ
    write_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_WRITE
