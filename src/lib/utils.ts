import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Génère un slug SEO-friendly à partir d'un titre de métier
 * Exemple: "Conducteur / Conductrice d'engins agricoles" -> "conducteur-conductrice-dengins-agricoles"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    // Remplacer les caractères spéciaux et espaces
    .replace(/[àáâäã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    // Remplacer les caractères spéciaux par des tirets
    .replace(/[^a-z0-9]+/g, '-')
    // Supprimer les tirets en début et fin
    .replace(/^-+|-+$/g, '')
    // Limiter la longueur pour les URLs
    .substring(0, 100);
}

/**
 * Normalise une chaîne pour la recherche (supprime les accents et espaces)
 */
export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâäã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
