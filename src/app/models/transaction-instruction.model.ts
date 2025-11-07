export type TransactionType =
  | 'PAYIN_PLATEFORME'
  | 'PAYOUT_LOCATEUR'
  | 'COMMISSION_PLATEFORME'
  | 'REFUND_LOCATAIRE_FROM_LOCATEUR'
  | 'REFUND_LOCATAIRE_FROM_PLATEFORME';

export type TransactionStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED';

export interface TransactionInstructionDTO {
  id: string;
  reservationId?: string | null;
  paiementId?: string | null;
  type: TransactionType;
  statut: TransactionStatus;
  fromRibId?: string | null;
  toRibId?: string | null;
  montant: number;
  reference?: string | null;
  notes?: string | null;
  dateCreation: string;
  dateModification: string;
  dateExecution?: string | null;
}


