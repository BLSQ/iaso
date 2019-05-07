CATT = "CATT"
PG = "PG"
PL = "PL"
CTCWOO = "CTCWOO"
MAECT = "MAECT"
RDT = "RDT"
SF = "SF"
SP = "SP"
IFAT = "IFAT"
LCR = "LCR"
DIL = "DIL"
GE = "GE"
CLINICAL_SICKNESS = "CLINICAL_SICKNESS"
LNP = "LNP"
PARASIT = "PARASIT"

TEST_TYPE_CHOICES = (
    (CATT, "CATT"),
    (PG, "PG"),
    (PL, "PL"),
    (CTCWOO, "CTCWOO"),
    (MAECT, "MAECT"),
    (RDT, "RDT"),
    (SF, "Sang Frais"),
    (SP, "Ponction Sternale"),
    (IFAT, "ImmunoFluorescence Antibody Test"),
    (LCR, "Liquide CéphaloRachidien"),
    (DIL, "Dil = ou > + à 1/16 en zone hyperendémique"),
    (GE, "Goutte Épaisse"),
    (CLINICAL_SICKNESS, "Malade clinique"),
    (LNP, "Lymph Node Puncture"),
    (PARASIT, "Confirmation parasytologique"),
)
# See also filters.py: screening_tests and confirmation_tests
TYPES_CONFIRMATION = {PG, CTCWOO, MAECT, PL, GE, LCR, LNP, SF}
TYPES_WITH_IMAGES = {CATT, RDT}
TYPES_WITH_VIDEOS = {PG, CTCWOO, MAECT, PL}

SCREENING_ACTIVE = "active"
SCREENING_PASSIVE = "passive"
SCREENING_TYPE_CHOICES = ((SCREENING_ACTIVE, "Dépistage actif"), (SCREENING_PASSIVE, "Dépistage passif"))

GPS_SRID = 4326
