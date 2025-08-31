#!/usr/bin/env python3
"""
Script pour exporter les données ROME v459 depuis les fichiers CSV vers JSON
"""

import csv
import json
from pathlib import Path

def normalize_text(text):
    """Normalise le texte en retirant les espaces superflus"""
    if not text or text.strip() == '':
        return None
    return text.strip()

def export_rome_data():
    """Exporte les données ROME au format JSON"""
    
    # Vérifier l'existence des fichiers CSV
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
            reader = csv.DictReader(f, delimiter=',')  # Note: délimiteur virgule pour v459
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                titre = normalize_text(row.get('libelle_rome', ''))
                
                if not code_rome or not titre:
                    continue
                
                occupations.append({
                    "code_rome": code_rome,
                    "titre": titre,
                    "secteur": None,  # Pas de secteur dans ce fichier
                    "description": None  # Sera ajouté depuis le fichier texte
                })
                
                tasks_per_rome[code_rome] = []
        
        print(f"✅ {len(occupations)} occupations traitées")
        
    except Exception as e:
        print(f"❌ Erreur lors de la lecture du fichier ROME: {e}")
        return
    
    # Lecture du fichier texte pour récupérer les définitions et tâches
    print("🔄 Traitement des textes...")
    try:
        with open(csv_files['texte'], 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=',')
            for row in reader:
                code_rome = normalize_text(row.get('code_rome', ''))
                libelle_type = normalize_text(row.get('libelle_type_texte', ''))
                libelle_texte = normalize_text(row.get('libelle_texte', ''))
                
                if not code_rome or not libelle_texte:
                    continue
                
                # Si c'est une définition, l'ajouter comme description de l'occupation
                if libelle_type == 'definition':
                    # Trouver l'occupation correspondante et ajouter la description
                    for occ in occupations:
                        if occ['code_rome'] == code_rome and not occ['description']:
                            occ['description'] = libelle_texte
                            break
                
                # Toutes les autres entrées sont considérées comme des tâches
                if code_rome in tasks_per_rome:
                    # Éviter les doublons
                    if not any(task['libelle'] == libelle_texte for task in tasks_per_rome[code_rome]):
                        tasks_per_rome[code_rome].append({
                            "occupation_code_rome": code_rome,
                            "libelle": libelle_texte[:255] if len(libelle_texte) > 255 else libelle_texte,
                            "description": libelle_texte
                        })
        
    except Exception as e:
        print(f"❌ Erreur lors de la lecture des textes: {e}")
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