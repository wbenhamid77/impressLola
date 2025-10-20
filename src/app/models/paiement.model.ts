export interface Paiement {
  id: string;
  reservationId: string;
  locataireId: string;
  locateurId: string;
  montant: number;
  typePaiement: TypePaiement;
  statut: StatutPaiement;
  modePaiement: ModePaiement;
  description: string;
  numeroTransaction?: string;
  referenceExterne?: string;
  metadonnees?: string;
  dateCreation: Date;
  dateEcheance: Date;
  datePaiement?: Date;
  dateRemboursement?: Date;
  numeroRemboursement?: string;
  raisonRemboursement?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TypePaiement {
  ACOMPTE = 'ACOMPTE',
  SOLDE = 'SOLDE',
  TOTAL = 'TOTAL',
  REMBOURSEMENT = 'REMBOURSEMENT'
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  PAYE = 'PAYE',
  ECHEC = 'ECHEC',
  ANNULE = 'ANNULE',
  REMBOURSE = 'REMBOURSE',
  EXPIRE = 'EXPIRE'
}

export enum ModePaiement {
  CARTE_BANCAIRE = 'CARTE_BANCAIRE',
  PAYPAL = 'PAYPAL',
  VIREMENT_BANCAIRE = 'VIREMENT_BANCAIRE',
  PAIEMENT_SUR_PLACE = 'PAIEMENT_SUR_PLACE',
  CHEQUE = 'CHEQUE'
}

export interface CreatePaiementRequest {
  reservationId: string;
  montant: number;
  typePaiement: TypePaiement;
  modePaiement: ModePaiement;
  description?: string;
}

export interface ConfirmerPaiementRequest {
  numeroTransaction: string;
  referenceExterne?: string;
  metadonnees?: string;
}

export interface RembourserPaiementRequest {
  numeroRemboursement: string;
  raisonRemboursement: string;
  metadonnees?: string;
}

export interface PaiementStats {
  totalPaiements: number;
  paiementsEnAttente: number;
  paiementsPayes: number;
  paiementsEchecs: number;
  montantTotal: number;
  montantEnAttente: number;
  montantPaye: number;
}
