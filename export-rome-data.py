#!/usr/bin/env python3
"""
Script pour exporter les données ROME depuis les fichiers CSV vers JSON
pour l'import dans PostgreSQL via l'API Next.js
"""

import pandas as pd
import json
import os
from pathlib import Path

def normalize_text(text):
    """Normalise le texte en retirant les espaces superflus"""
    if pd.isna(text) or not text:
        return None
    return str(text).strip()

def export_rome_data():
    """Exporte les données ROME au format JSON"""
    
    # Vérifier l'existence des fichiers CSV
    csv_files = [
        "unix_referentiel_code_rome_v350.csv",
        "unix_referentiel_activite_riasec_v350.csv", 
        "unix_referentiel_competence_v350.csv",
        "unix_referentiel_env_travail_v350.csv"
    ]
    
    missing_files = [f for f in csv_files if not Path(f).exists()]
    if missing_files:
        print(f"❌ Fichiers CSV manquants: {', '.join(missing_files)}")
        print("📥 Téléchargez-les depuis: https://www.data.gouv.fr/fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome/")
        return
    
    print("🔍 Lecture des fichiers CSV...")
    
    # Lecture des fichiers
    try:
        df_rome = pd.read_csv("unix_referentiel_code_rome_v350.csv", encoding='utf-8', sep=';')
        df_activite = pd.read_csv("unix_referentiel_activite_riasec_v350.csv", encoding='utf-8', sep=';')
        df_competence = pd.read_csv("unix_referentiel_competence_v350.csv", encoding='utf-8', sep=';')
        df_env_travail = pd.read_csv("unix_referentiel_env_travail_v350.csv", encoding='utf-8', sep=';')
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des CSV: {e}")
        return
    
    print(f"📊 Données lues: {len(df_rome)} codes ROME, {len(df_activite)} activités, {len(df_competence)} compétences, {len(df_env_travail)} environnements")
    
    # Traitement des occupations
    occupations = []
    tasks_per_rome = {}
    
    for _, row in df_rome.iterrows():
        code_rome = str(row['code_rome']).strip()
        titre = normalize_text(row['libelle_rome'])
        
        if not code_rome or not titre:
            continue
            
        # Récupération du secteur depuis code_ogr si disponible
        secteur = None
        if 'code_ogr' in row and pd.notna(row['code_ogr']):
            secteur = normalize_text(row.get('libelle_ogr', ''))
        
        occupations.append({
            "code_rome": code_rome,
            "titre": titre,
            "secteur": secteur,
            "description": normalize_text(row.get('definition', ''))
        })
        
        tasks_per_rome[code_rome] = []
    
    print(f"✅ {len(occupations)} occupations traitées")
    
    # Traitement des tâches depuis les activités
    print("🔄 Traitement des activités...")
    for _, row in df_activite.iterrows():
        code_rome = str(row['code_rome']).strip()
        libelle = normalize_text(row['libelle_activite'])
        
        if code_rome in tasks_per_rome and libelle:
            # Éviter les doublons
            if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                tasks_per_rome[code_rome].append({
                    "occupation_code_rome": code_rome,
                    "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                    "description": libelle
                })
    
    # Traitement des tâches depuis les compétences
    print("🔄 Traitement des compétences...")
    for _, row in df_competence.iterrows():
        code_rome = str(row['code_rome']).strip()
        libelle = normalize_text(row['libelle_competence'])
        
        if code_rome in tasks_per_rome and libelle:
            # Éviter les doublons
            if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                tasks_per_rome[code_rome].append({
                    "occupation_code_rome": code_rome,
                    "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                    "description": libelle
                })
    
    # Traitement des tâches depuis l'environnement de travail
    print("🔄 Traitement des environnements de travail...")
    for _, row in df_env_travail.iterrows():
        code_rome = str(row['code_rome']).strip()
        libelle = normalize_text(row['libelle_env_travail'])
        
        if code_rome in tasks_per_rome and libelle:
            # Éviter les doublons
            if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                tasks_per_rome[code_rome].append({
                    "occupation_code_rome": code_rome,
                    "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                    "description": libelle
                })
    
    # Aplatir la liste des tâches
    all_tasks = []
    for code_rome, tasks in tasks_per_rome.items():
        all_tasks.extend(tasks)
    
    print(f"✅ {len(all_tasks)} tâches traitées")
    
    # Export vers JSON
    data = {
        "occupations": occupations,
        "tasks": all_tasks
    }
    
    output_file = "rome_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Données exportées vers {output_file}")
    print(f"📊 Résumé: {len(occupations)} occupations, {len(all_tasks)} tâches")
    
    # Afficher quelques stats
    stats_by_rome = {code: len(tasks) for code, tasks in tasks_per_rome.items()}
    avg_tasks = sum(stats_by_rome.values()) / len(stats_by_rome)
    print(f"📈 Moyenne de {avg_tasks:.1f} tâches par métier")

if __name__ == "__main__":
    export_rome_data()