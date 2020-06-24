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
RESEARCH_PL = "RESEARCH_PL"
IELISA = "iELISA"

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
    (PARASIT, "Confirmation parasitologique"),
    (RESEARCH_PL, "PL de recherche"),
    (IELISA, "iELISA"),
)
# See also filters.py: screening_tests and confirmation_tests
TYPES_SCREENING = {CATT, RDT, IELISA}
TYPES_CONFIRMATION = {PG, CTCWOO, MAECT, PL, GE, LCR, LNP, SF, RESEARCH_PL}
TYPES_WITH_IMAGES = {CATT, RDT}
TYPES_WITH_VIDEOS = {PG, CTCWOO, MAECT, PL}

SCREENING_ACTIVE = "active"
SCREENING_PASSIVE = "passive"
SCREENING_TYPE_CHOICES = (
    (SCREENING_ACTIVE, "Dépistage actif"),
    (SCREENING_PASSIVE, "Dépistage passif"),
)

GPS_SRID = 4326

PL_STAGE1 = "stage1"
PL_STAGE2 = "stage2"
PL_STAGE_UNKNOWN = "unknown"

DATE_FORMAT = "%Y-%m-%d"
