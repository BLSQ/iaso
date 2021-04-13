from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Project, Instance, Form
from django.contrib.gis.geos import Point
from uuid import uuid4
from django.db import models, transaction
from uuid import uuid4


template = {
  "gps": "9.795678 8.495523 100 10",
  "_version": "2021032801",
  "instanceID": "uuid:ebcc1646-0a86-4e2d-80f0-48f3690ba61c",
  "paque_bancs": "0",
  "paque_milieu": "rural",
  "paque_regime": "ECOLE_CONVENTIONNEE_CATHOLIQUE",
  "paque_cloture": "EN_HAIE",
  "paque_latrine": "0",
  "paque_secteur": "pub",
  "paque_nb_ens_D4_F": "",
  "paque_nb_ens_D4_G": "",
  "paque_enseignant_1": "",
  "paque_enseignant_2": "",
  "paque_enseignant_3": "",
  "paque_enseignant_4": "",
  "paque_enseignant_5": "",
  "paque_enseignant_6": "",
  "paque_mecanisation": "mecanise_paye",
  "paque_nbr_classe_1": "",
  "paque_nbr_classe_2": "",
  "paque_nbr_classe_3": "",
  "paque_nbr_classe_4": "",
  "paque_nbr_classe_5": "",
  "paque_nbr_classe_6": "",
  "paque_nbre_eleve_1": "",
  "paque_nbre_eleve_2": "",
  "paque_nbre_eleve_3": "",
  "paque_nbre_eleve_4": "",
  "paque_nbre_eleve_5": "",
  "paque_nbre_eleve_6": "",
  "paque_eleve_F_6_ans": "",
  "paque_eleve_F_7_ans": "",
  "paque_eleve_F_8_ans": "",
  "paque_eleve_F_9_ans": "",
  "paque_eleve_G_6_ans": "",
  "paque_eleve_G_7_ans": "",
  "paque_eleve_G_8_ans": "",
  "paque_eleve_G_9_ans": "",
  "paque_terrain_sport": "1",
  "paque_total_latrine": "",
  "paque_bancs_bon_etat": "3",
  "paque_eleve_F_10_ans": "",
  "paque_eleve_F_11_ans": "",
  "paque_eleve_G_10_ans": "",
  "paque_eleve_G_11_ans": "",
  "paque_enseignant_1_F": "",
  "paque_enseignant_1_G": "",
  "paque_enseignant_2_F": "",
  "paque_enseignant_2_G": "",
  "paque_enseignant_3_F": "",
  "paque_enseignant_3_G": "",
  "paque_enseignant_4_F": "",
  "paque_enseignant_4_G": "",
  "paque_enseignant_5_F": "",
  "paque_enseignant_5_G": "",
  "paque_enseignant_6_F": "",
  "paque_enseignant_6_G": "",
  "paque_nbre_eleve_1_f": "",
  "paque_nbre_eleve_1_g": "",
  "paque_nbre_eleve_2_f": "",
  "paque_nbre_eleve_2_g": "",
  "paque_nbre_eleve_3_f": "",
  "paque_nbre_eleve_3_g": "",
  "paque_nbre_eleve_4_f": "",
  "paque_nbre_eleve_4_g": "",
  "paque_nbre_eleve_5_f": "",
  "paque_nbre_eleve_5_g": "",
  "paque_nbre_eleve_6_f": "",
  "paque_nbre_eleve_6_g": "",
  "paque_nb_ens_D6P6A2_F": "",
  "paque_nb_ens_D6P6A2_G": "",
  "paque_nb_ens_gradue_F": "",
  "paque_nb_ens_gradue_G": "",
  "paque_total_latrine_F": "",
  "paque_total_latrine_G": "",
  "paque_cours_recreation": "1",
  "paque_eleve_1_F_integre": "",
  "paque_eleve_1_F_refugie": "",
  "paque_eleve_1_G_integre": "",
  "paque_eleve_1_G_refugie": "",
  "paque_eleve_2_F_integre": "",
  "paque_eleve_2_F_refugie": "",
  "paque_eleve_2_G_integre": "",
  "paque_eleve_2_G_refugie": "",
  "paque_eleve_3_F_integre": "",
  "paque_eleve_3_F_refugie": "",
  "paque_eleve_3_G_integre": "",
  "paque_eleve_3_G_refugie": "",
  "paque_eleve_4_F_integre": "",
  "paque_eleve_4_F_refugie": "",
  "paque_eleve_4_G_integre": "",
  "paque_eleve_4_G_refugie": "",
  "paque_eleve_5_F_integre": "",
  "paque_eleve_5_F_refugie": "",
  "paque_eleve_5_G_integre": "",
  "paque_eleve_5_G_refugie": "",
  "paque_eleve_6_F_integre": "",
  "paque_eleve_6_F_refugie": "",
  "paque_eleve_6_G_integre": "",
  "paque_eleve_6_G_refugie": "",
  "paque_nb_ens_licencie_F": "",
  "paque_nb_ens_licencie_G": "",
  "paque_eleve_1_F_Handicap": "",
  "paque_eleve_1_F_etranger": "",
  "paque_eleve_1_G_Handicap": "",
  "paque_eleve_1_G_etranger": "",
  "paque_eleve_2_F_Handicap": "",
  "paque_eleve_2_F_etranger": "",
  "paque_eleve_2_G_Handicap": "",
  "paque_eleve_2_G_etranger": "",
  "paque_eleve_3_F_Handicap": "",
  "paque_eleve_3_F_etranger": "",
  "paque_eleve_3_G_Handicap": "",
  "paque_eleve_3_G_etranger": "",
  "paque_eleve_4_F_Handicap": "",
  "paque_eleve_4_F_etranger": "",
  "paque_eleve_4_G_Handicap": "",
  "paque_eleve_4_G_etranger": "",
  "paque_eleve_5_F_Handicap": "",
  "paque_eleve_5_F_etranger": "",
  "paque_eleve_5_G_Handicap": "",
  "paque_eleve_5_G_etranger": "",
  "paque_eleve_6_F_Handicap": "",
  "paque_eleve_6_F_etranger": "",
  "paque_eleve_6_G_Handicap": "",
  "paque_eleve_6_G_etranger": "",
  "paque_eleve_F_6_ans_plus": "",
  "paque_eleve_F_7_ans_plus": "",
  "paque_eleve_F_8_ans_plus": "",
  "paque_eleve_F_9_ans_plus": "",
  "paque_eleve_G_6_ans_plus": "",
  "paque_eleve_G_7_ans_plus": "",
  "paque_eleve_G_8_ans_plus": "",
  "paque_eleve_G_9_ans_plus": "",
  "paque_total_enseignant_F": "",
  "paque_total_enseignant_G": "",
  "paque_eleve_F_10_ans_plus": "",
  "paque_eleve_F_11_ans_plus": "",
  "paque_eleve_F_moins_6_ans": "",
  "paque_eleve_F_moins_7_ans": "",
  "paque_eleve_F_moins_8_ans": "",
  "paque_eleve_F_moins_9_ans": "",
  "paque_eleve_G_10_ans_plus": "",
  "paque_eleve_G_11_ans_plus": "",
  "paque_eleve_G_moins_6_ans": "",
  "paque_eleve_G_moins_7_ans": "",
  "paque_eleve_G_moins_8_ans": "",
  "paque_eleve_G_moins_9_ans": "",
  "paque_total_latrine_eleve": "",
  "paque_total_personnel_ens": "",
  "paque_eleve_1_F_autochtone": "",
  "paque_eleve_1_F_redoublant": "",
  "paque_eleve_1_G_autochtone": "",
  "paque_eleve_1_G_redoublant": "",
  "paque_eleve_2_F_autochtone": "",
  "paque_eleve_2_F_redoublant": "",
  "paque_eleve_2_G_autochtone": "",
  "paque_eleve_2_G_redoublant": "",
  "paque_eleve_3_F_autochtone": "",
  "paque_eleve_3_F_redoublant": "",
  "paque_eleve_3_G_autochtone": "",
  "paque_eleve_3_G_redoublant": "",
  "paque_eleve_4_F_autochtone": "",
  "paque_eleve_4_F_redoublant": "",
  "paque_eleve_4_G_autochtone": "",
  "paque_eleve_4_G_redoublant": "",
  "paque_eleve_5_F_autochtone": "",
  "paque_eleve_5_F_redoublant": "",
  "paque_eleve_5_G_autochtone": "",
  "paque_eleve_5_G_redoublant": "",
  "paque_eleve_6_F_autochtone": "",
  "paque_eleve_6_F_redoublant": "",
  "paque_eleve_6_G_autochtone": "",
  "paque_eleve_6_G_redoublant": "",
  "paque_eleve_F_moins_10_ans": "",
  "paque_eleve_F_moins_11_ans": "",
  "paque_eleve_G_moins_10_ans": "",
  "paque_eleve_G_moins_11_ans": "",
  "paque_total_personnel_meca": "",
  "paque_total_personnel_admin": "",
  "paque_total_personnel_ens_F": "",
  "paque_total_personnel_ens_G": "",
  "paque_nb_eligible_retraite_F": "",
  "paque_nb_eligible_retraite_G": "",
  "paque_total_personnel_meca_F": "",
  "paque_total_personnel_meca_G": "",
  "paque_total_personnel_admin_F": "",
  "paque_total_personnel_admin_G": "0",
  "paque_total_personnel_ouvrier": "",
  "paque_total_latrine_enseignant": "",
  "paque_total_personnel_ouvrier_F": "",
  "paque_total_personnel_ouvrier_G": "",
  "paque_total_personnel_admin_meca_paye": "",
  "paque_total_personnel_admin_meca_paye_F": "",
  "paque_total_personnel_admin_meca_paye_G": "",
  "paque_total_personnel_ouvrier_meca_paye": "",
  "paque_total_personnel_ouvrier_meca_paye_F": "",
  "paque_total_personnel_ouvrier_meca_paye_G": ""
}


class Command(BaseCommand):
    help = "Import a complete tree from a csv file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv_file", type=str
        )
        parser.add_argument(
            "--mapping_csv_file", type=str
        )
        parser.add_argument(
            "--form_id", type=str
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            file_name = options.get("csv_file")
            mapping_file_name = options.get("mapping_csv_file")
            form_id = options.get("form_id")
            form = Form.objects.get(form_id=form_id)
            mapping = {}
            with open(mapping_file_name, encoding='utf-8-sig') as mappingfile:
                mapping_csv_reader = csv.reader(mappingfile, delimiter=";")

                for row in mapping_csv_reader:
                    row_name = row[0]
                    xls_form_id = row[1]
                    formula = row[2].strip()
                    if xls_form_id.strip():
                        mapping[row_name] = {'xls_form_id': xls_form_id }
                        if formula:
                            mapping[row_name]['formula'] = formula


            print("mapping", mapping, mapping.keys())
            keys = list(mapping.keys())

            #print(file_name)
            with open(file_name, encoding='utf-8-sig') as csv_file:
                csv_reader = csv.reader(csv_file, delimiter=";")
                index = 1
                for row in csv_reader:
                    if index % 1000 == 0:
                        print("index", index)

                    if index == 1:
                        headers = row
                        col_indices = {headers[i].strip(): i for i in range(len(headers))}
                        #print("col_indices", col_indices)
                    else:
                        data = template.copy()
                        for key in keys:
                            m = mapping[key]
                            if m.get('formula', None) is None:
                                #print('key', key, m)
                                try:
                                    value = row[col_indices[key]]
                                    data[m['xls_form_id']] = value
                                    #print("value for %s %s %s" % (key, m['xls_form_id'], value, ))
                                except:
                                    pass
                            uuid = str(uuid4())
                            data['instanceID'] = "uuid:%s" % uuid
                            #print(data)
                        try :
                            ou = OrgUnit.objects.get(source_ref=row[0].strip())

                            instance = Instance()
                            instance.json = data
                            instance.uuid = uuid
                            instance.org_unit = ou
                            instance.form = form
                            instance.project_id = 1
                            f_name = "%s-%s.xml" % (ou.name, uuid)
                            instance.file = f_name
                            instance.file_name = f_name
                            instance.save()
                        except:
                            pass
                    index += 1


