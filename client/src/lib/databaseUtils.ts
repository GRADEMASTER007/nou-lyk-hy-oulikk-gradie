import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Securely purges all transaction-related data from Firestore.
 * Preserves products, pricing, and company settings.
 */
export const purgeAccountingData = async () => {
  const collectionsToPurge = [
    'quotes',
    'invoices',
    'payments',
    'communications',
    'activities',
    'clients', // Removing demo clients as they are part of the demo transactions
    'email_conversations',
    'whatsapp_conversations'
  ];

  const batch = writeBatch(db);
  let deletedCount = 0;

  for (const collectionName of collectionsToPurge) {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    
    snapshot.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
      deletedCount++;
    });
  }

  if (deletedCount > 0) {
    await batch.commit();
  }

  return deletedCount;
};
