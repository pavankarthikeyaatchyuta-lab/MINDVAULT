import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  // On Google Cloud Run or GCP with Application Default Credentials (ADC)
  if (process.env.NODE_ENV === 'production' || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return initializeApp({
      projectId: projectId || 'mindvault-production',
    });
  }

  // Local development with service account key json if provided
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
  } catch {
    return initializeApp({
      projectId: projectId || 'mindvault-dev',
    });
  }
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  const db = getFirestore(getAdminApp());
  // Disable automatic timestamp setting warnings if any
  return db;
}
