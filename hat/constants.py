CATT = 'CATT'
PG = 'PG'
CTCWOO = 'ctcwoo'
MAECT = 'maect'
RDT = 'RDT'

TEST_TYPE_CHOICES = (
    (CATT, 'CATT'),
    (PG, 'PG'),
    (CTCWOO, 'ctcwoo'),
    (MAECT, 'maect'),
    (RDT, 'RDT')
)

TYPES_WITH_IMAGES = set([CATT, RDT])
TYPES_WITH_VIDEOS = set([PG, CTCWOO, MAECT])