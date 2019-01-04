from django.core.management.base import BaseCommand
from django.db.models import Q

from hat.patient.duplicates import merge_patient
from hat.patient.identify import name_normalize
from hat.patient.models import Patient


class Command(BaseCommand):
    help = "Try to fix some patients that were wrongly formatted originally. For example 'Titi   Toto' to become " \
           "'Titi Toto' and merge with the corresponding patient if applicable. Also replaces messed up accents in " \
           "first names."

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

    first_names_fix = {
        'Jos�e': 'Josée',
        'Ther�se': 'Therèse',
        'Elis�e': 'Elisée',
        'Jos�': 'José',
        'Andr�': 'André',
        'Aim�e': 'Aimée',
        'No�l': 'Noël',
        'Doroth�e': 'Dorothée',
        'Mo�se': 'Moïse',
        'Elys�': 'Elysé',
        'Jo�l': 'Joël',
        'Elys�e': 'Elysée',
        'Mardoch�': 'Mardoché',
        'Timoth�e': 'Thimothée',
        'Aim�': 'Aimé',
        'Exos�': 'Exosé',
        'Exauc�': 'Exaucé',
        'Excauc�': 'Excaucé',
        'Elis�': 'Elisé',
        'Honor�': 'Honoré',
        'Lep�re': 'Lepère',
        'Isma�l': 'Ismaël',
        'Mb�': 'Mbô',
        'Fran�oise': 'Françoise',
        'M�re': 'Mère',
        'Josu�': 'Josué',
        'Anth�': 'Anthé',
        'Rapha�l': 'Raphaël',
        'Desir�': 'Désiré',
        'Exoc�': 'Exocé',
        'Ren�': 'René',
        'God�': 'Godé',
        'Micha�l': 'Michaël',
        'Doroth�': 'Dorothé',
        'Le p�re': 'Le père',
        'Anacl�': 'Anaclé',
        'B�n�dite': 'Bénédicte',
        'B�b�': 'Bébé',
        'Isra�l': 'Israël',
        'Josou�': 'Josoué',
        'Natana�l': 'Natanaël',
        'Dieudonn�': 'Dieudonné',
        'R�el': 'Réel',
        'Fran�ois': 'François',
        'Th�th�': 'Théthé',
        'Os�': 'Osé',
        'Ga�l': 'Gaël',
        'J�r�mie': 'Jérémie',
        'Ad�le': 'Adèle',
        'Erv�': 'Ervé',
        'Thimot�': 'Thimoté',
        'Herv�': 'Hervé',
        'No�la': 'Noëla',
        'Bient�t': 'Bientôt',
        'Diedonn�': 'Diedonné',
        'Mika�l': 'Mikaël',
        'Os�e': 'Osée',
        'Fellicit�': 'Fellicité',
        'Dosith�e': 'Dosithée',
        'Abiga�l': 'Abigaël',
        'Sel�': 'Selé',
        'Jepht�': 'Jephté',
        'Ra�s': 'Raïs',
        'Lumi�re': 'Lumière',
        'Mabel�': 'Mabelé',
        'Dieudon�': 'Dieudoné',
        'Tr�sor': 'Trésor',
        'P�p�': 'Pépé',
        '�e�ile': 'Çeçile',
        'Adra�de': 'Adraïde',
        'A�cha': 'Aïcha',
        'Fid�le': 'Fidèle',
        'Mo�sette': 'Moïsette',
        'Bont�': 'Bonté',
        'gra�ia': 'Graçia',
        'b�': 'Bé',
        'Amed�': 'Amedé',
        '�ecile': 'Çecile',
        'Dieu donn�': 'Dieu donné',
        'joss�': 'Jossé',
        'Souv�': 'Souvé',
        'Abb�': 'Abbé',
        'Josou�s': 'Josoués',
        '�elestine': 'Çelestine',
        'Dorot�': 'Doroté',
        'Anic�': 'Anicé',
        'Dozit�': 'Dozité',
        'floren�e': 'Florençe',
        'Th�ophil': 'Théophil',
    }

    def handle(self, *args, **options):
        patients = Patient.objects.filter(
            Q(first_name__regex=r"\s{2,}")
            | Q(last_name__regex=r"\s{2,}")
            | Q(post_name__regex=r"\s{2,}")
            | Q(mothers_surname__regex=r"\s{2,}")
            | Q(first_name__in=self.first_names_fix.keys())
        )

        print(f"Patients with multiple spaces to process: {patients.count()}")
        patients_updated = 0
        patients_merged = 0
        for patient in patients:
            first_name = name_normalize(patient.first_name)
            for replace_from, replace_to in self.first_names_fix.items():
                if first_name and replace_from in first_name:
                    first_name = first_name.replace(replace_from, replace_to)
            last_name = name_normalize(patient.last_name)
            post_name = name_normalize(patient.post_name)
            mothers_surname = name_normalize(patient.mothers_surname)

            non_name_filters = {'sex': patient.sex, 'year_of_birth': patient.year_of_birth,
                                'origin_area': patient.origin_area, 'origin_village': patient.origin_village,
                                'origin_raw_ZS': patient.origin_raw_ZS, 'origin_raw_AS': patient.origin_raw_AS,
                                'origin_raw_village': patient.origin_raw_village}

            normalized_patient = Patient.objects.filter(
                first_name=first_name,
                last_name=last_name,
                post_name=post_name,
                mothers_surname=mothers_surname,
                **non_name_filters
            ).exclude(id=patient.id)

            count = normalized_patient.count()
            if count == 0:
                if options['verbose']:
                    print(f"Updating {patient.id} {patient.first_name} {patient.last_name} {patient.post_name} {patient.mothers_surname}")
                    print(f"to {first_name} {last_name} {post_name} {mothers_surname}")
                patient.first_name = first_name
                patient.last_name = last_name
                patient.post_name = post_name
                patient.mothers_surname = mothers_surname
                patient.save()
                patients_updated += 1
            elif normalized_patient.count() == 1:
                if options['verbose']:
                    print(f"Merging {patient.id} {patient.first_name} {patient.last_name} {patient.post_name} {patient.mothers_surname}")
                    print(f"towards {normalized_patient[0].id} {normalized_patient[0].first_name} {normalized_patient[0].last_name} {normalized_patient[0].post_name} {normalized_patient[0].mothers_surname}")
                merge_patient(patient, normalized_patient[0], None)
                patients_merged += 1
            else:
                print("Unexpected multiple matches for normalized patient", first_name, last_name, post_name,
                      mothers_surname, normalized_patient)

        print(f"Done. Updated {patients_updated}, merged {patients_merged}")
