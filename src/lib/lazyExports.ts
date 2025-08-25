// Créer un point d'entrée unique pour les imports dynamiques

export async function loadPapaParse() {
  const mod = await import('papaparse');
  return mod.default || mod;
}

export async function loadJsPDF() {
  const mod = await import('jspdf');
  return mod.default || mod;
}

export async function loadXLSX() {
  // xlsx utilise un export ESM par défaut nommé
  const mod: any = await import('xlsx');
  return mod;
}
