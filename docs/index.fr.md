# Bienvenue dans la documentation d'IASO

# Introduction à IASO
IASO est une plateforme innovante, open-source, bilingue (EN/FR) de **collecte de données à fonctionnalités géospatiales avancées** pour planifier, surveiller et évaluer les programmes de santé, environnementaux ou sociaux dans les pays à revenu faible et intermédiaire (PRFI). IASO est reconnu comme un **Bien Public Numérique** par l'Alliance des Biens Publics Numériques et figure parmi les logiciels **Global Goods** de Digital Square, témoignant de son utilité publique.

IASO comprend :

- un **tableau de bord web** - destiné aux superviseurs pour organiser la collecte de données et la gestion des données géographiques
- une **application mobile** qui fonctionne également **hors ligne** - destinée aux utilisateurs sur le terrain pour remplir des formulaires et envoyer des données lorsque le réseau est disponible
- une **interface de correspondance et de script** pour analyser, comparer et fusionner plusieurs sources de données géographiques
- une **intégration bidirectionnelle avec DHIS2**, le système d'information de gestion de la santé largement utilisé dans les PRFI
  
En termes de fonctionnalités, IASO peut être résumé autour de **quatre composantes principales** qui sont interconnectées et renforcent leurs capacités mutuelles :

- **Gestion des données géospatiales (Géoregistre)**
    - Gérer plusieurs listes d'unités d'organisation (par exemple, zones de santé, districts, établissements de santé ou écoles) y compris leurs coordonnées GPS et frontières
    - Suivre les modifications apportées aux unités d'organisation
    - Comparer plusieurs sources de données géographiques
    - Proposer des modifications aux unités d'organisation depuis l'application mobile IASO et les valider sur le web
   
- **Collecte de données géo-structurées**
    - Créer des formulaires de collecte de données en utilisant le populaire format XLS et les importer dans IASO
    - Lier vos formulaires à un ou plusieurs types d'unités organisationnelles (par exemple, National/Régional/District/Établissement de santé) pour structurer géographiquement votre collecte de données
    - Suivre les changements avec la gestion des versions de vos formulaires
    - Valider depuis le web toutes les soumissions de formulaires envoyées par l'application mobile IASO
    - Suivre l'exhaustivité de la collecte de données par niveau d'unités d'organisation et identifier où se trouvent les problèmes
 
- **Microplanification**
    - Gérer des équipes d'utilisateurs et des équipes d'équipes
    - Attribuer des tâches de collecte de données aux équipes et aux utilisateurs en utilisant une carte interactive
    - Créer des plannings avec un périmètre, une durée et un ou plusieurs formulaires de collecte de données
 
- **Entités** - celles-ci peut consister en des individus (par exemple, les bénéficiaires de programmes de santé) ou des objets physiques (par exemple, des lots de vaccins, des moustiquaires, etc.). Les workflows permettent de suivre les entités en ouvrant des formulaires spécifiques en fonction des réponses données à des formulaires précédents.
    - Créer des types d'entités (bénéficiaires, stocks ou autres)
    - Attribuer des workflows à des types d'entités
    - Enregistrer des entités via l'application mobile (hors ligne)
    - Synchroniser les applications mobile et web
    - Comparer et fusionner des entités si nécessaire
    - Enregistrer les données des entités sur une carte NFC
 
La plateforme a été mise en œuvre au Bénin, au Burkina Faso, au Burundi, au Cameroun, en République Centrafricaine, en République Démocratique du Congo, en Haïti, en Côte d'Ivoire, au Mali, au Niger, au Nigéria et en Ouganda. Elle est le registre géographique officiel au Burkina Faso depuis 2023. IASO a également été mise en œuvre au niveau régional (région AFRO) pour soutenir l'Initiative Mondiale pour l'Eradication de la Polio grâce à ses capacités de registres géospatiaux et d'établissements de santé.

# Technologies utilisées
IASO est composée d'une application Android white labeled utilisant Java/Kotlin, réutilisant une grande partie des projets ODK, et d'une plateforme web programmée en Python/GeoDjango sur PostGIS. Le frontend est principalement en React/Leaflet. L'API est implémentée via Django Rest Framework, et toutes les données sont stockées dans PostgreSQL ou le répertoire media/. L'un des objectifs est la facilité d'intégration avec d'autres plateformes. Nous avons déjà des imports et exports en formats CSV et GeoPackage, et nous visons une intégration facile avec OSM.

L'application mobile pour Android permet la soumission de formulaires et la création d'unités d'organisation. Les formulaires peuvent également être remplis dans une interface web via le service compagnon Enketo.

