'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona conforme o estado de login
    if (tokenStorage.getAccess()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Tela de carregamento enquanto redireciona
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a1f1e',
    }}>
      <img src="/logo-mdlab-branca.svg" alt="MD Lab" style={{ height: 56, opacity: 0.8 }} />
    </div>
  );
}
