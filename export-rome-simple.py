#!/usr/bin/env python3
"""
Script pour exporter les données ROME depuis les fichiers CSV vers JSON
Version simplifiée sans pandas
"""

import csv
import json
import os
from pathlib import Path

def normalize_text(text):
    """Normalise le texte en retirant les espaces superflus"""
    if not text or text.strip() == '':
        return None
    return text.strip()

def export_rome_data():
    """Exporte les données ROME au format JSON"""
    
    # Vérifier l'existence des fichiers CSV (version 459)
    csv_files = {
        'rome': "../unix_referentiel_code_rome_v459_utf8.csv",
        'texte': "../unix_texte_v459_utf8.csv"
    }
    
    missing_files = [f for f in csv_files.values() if not Path(f).exists()]
    if missing_files:
        print(f"❌ Fichiers CSV manquants: {', '.join(missing_files)}")
        return
    
    print("🔍 Lecture des fichiers CSV...")
    
    occupations = []
    tasks_per_rome = {}
    
    # Lecture du fichier des codes ROME
    try:
        with open(csv_files['rome'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                titre = normalize_text(row.get('libelle_rome', ''))
                
                if not code_rome or not titre:
                    continue
                    
                # Récupération du secteur depuis code_ogr si disponible
                secteur = normalize_text(row.get('libelle_ogr', ''))
                
                occupations.append({
                    "code_rome": code_rome,
                    "titre": titre,
                    "secteur": secteur,
                    "description": normalize_text(row.get('definition', ''))
                })
                
                tasks_per_rome[code_rome] = []
        
        print(f"✅ {len(occupations)} occupations traitées")
        
    except Exception as e:
        print(f"❌ Erreur lors de la lecture du fichier ROME: {e}")
        return
    
    # Lecture des activités
    print("🔄 Traitement des activités...")
    try:
        with open(csv_files['activite'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                libelle = normalize_text(row.get('libelle_activite', ''))
                
                if code_rome in tasks_per_rome and libelle:
                    # Éviter les doublons
                    if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                        tasks_per_rome[code_rome].append({
                            "occupation_code_rome": code_rome,
                            "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                            "description": libelle
                        })
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des activités: {e}")
        return
    
    # Lecture des compétences
    print("🔄 Traitement des compétences...")
    try:
        with open(csv_files['competence'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                libelle = normalize_text(row.get('libelle_competence', ''))
                
                if code_rome in tasks_per_rome and libelle:
                    # Éviter les doublons
                    if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                        tasks_per_rome[code_rome].append({
                            "occupation_code_rome": code_rome,
                            "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                            "description": libelle
                        })
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des compétences: {e}")
        return
    
    # Lecture des environnements de travail
    print("🔄 Traitement des environnements de travail...")
    try:
        with open(csv_files['env_travail'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                libelle = normalize_text(row.get('libelle_env_travail', ''))
                
                if code_rome in tasks_per_rome and libelle:
                    # Éviter les doublons
                    if not any(task['libelle'] == libelle for task in tasks_per_rome[code_rome]):
                        tasks_per_rome[code_rome].append({
                            "occupation_code_rome": code_rome,
                            "libelle": libelle[:255] if len(libelle) > 255 else libelle,
                            "description": libelle
                        })
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des environnements: {e}")
        return
    
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
    avg_tasks = sum(stats_by_rome.values()) / len(stats_by_rome) if stats_by_rome else 0
    print(f"📈 Moyenne de {avg_tasks:.1f} tâches par métier")

if __name__ == "__main__":
    export_rome_data()