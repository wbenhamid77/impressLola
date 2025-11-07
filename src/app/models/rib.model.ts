export type RibType = 'PLATEFORME' | 'LOCATEUR' | 'LOCATAIRE';

export interface RibDTO {
  id: string;
  type: RibType;
  locateurId?: string | null;
  locataireId?: string | null;
  iban: string;
  bic: string;
  titulaireNom: string;
  banque: string;
  actif: boolean;
  defautCompte: boolean;
  dateCreation: string;
  dateModification: string | null;
}

export interface CreateRibRequest {
  type: RibType;
  locateurId?: string;
  locataireId?: string;
  iban: string;
  bic: string;
  titulaireNom: string;
  banque: string;
  defautCompte?: boolean;
}


