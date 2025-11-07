import { TransactionInstructionDTO, TransactionType, TransactionStatus } from './transaction-instruction.model';

export interface LocateurFinancesDTO {
  locateurId: string;
  totalRevenus: number;
  totalRemboursements: number;
  totalPayins: number;
  totalCommissions: number;
  soldeNet: number;
}

// Ré-export des types pour faciliter l'utilisation
export type { TransactionInstructionDTO, TransactionType, TransactionStatus };

