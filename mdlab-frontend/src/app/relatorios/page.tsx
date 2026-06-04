'use client';

import AppLayout from '@/components/AppLayout';
import { Construction } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Construction size={32} color="#0d9488" />
        </div>
        <h1 style={{ fontSize: 22, color: '#0a1f1e', marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>Tela "Relatorios" em construção</h1>
        <p style={{ fontSize: 14, color: '#64748b', maxWidth: 380, lineHeight: 1.6 }}>
          Esta tela será construída em breve. A navegação e o layout já estão prontos!
        </p>
      </div>
    </AppLayout>
  );
}
