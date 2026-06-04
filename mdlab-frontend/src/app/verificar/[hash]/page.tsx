'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { laudosApi } from '@/lib/api';

export default function VerificarPage() {
  const params = useParams();
  const hash = params?.hash as string;
  const [resultado, setResultado] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!hash) return;
    laudosApi.verificar(hash)
      .then(setResultado)
      .catch(() => setResultado({ valido: false, mensagem: 'Erro ao verificar.' }))
      .finally(() => setCarregando(false));
  }, [hash]);

  const dataBR = (d: string) => d ? new Date(d).toLocaleString('pt-BR') : '—';

  return (
    <div style={tela}>
      <div style={card}>
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 30 }}><Loader2 size={32} className="spin" color="#0d9488" /><div style={{ marginTop: 12, color: '#64748b' }}>Verificando autenticidade...</div></div>
        ) : resultado?.valido ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldCheck size={34} color="#0d9488" />
              </div>
              <h1 style={{ fontSize: 20, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Laudo autêntico</h1>
              <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>Este documento foi emitido oficialmente</p>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Linha rotulo="Protocolo" valor={resultado.protocolo} mono />
              <Linha rotulo="Paciente" valor={resultado.paciente} />
              <Linha rotulo="Laboratório" valor={resultado.laboratorio} />
              <Linha rotulo="Município" valor={resultado.municipio} />
              <Linha rotulo="Emitido em" valor={dataBR(resultado.emitidoEm)} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldX size={34} color="#dc2626" />
            </div>
            <h1 style={{ fontSize: 20, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Laudo não encontrado</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 8 }}>{resultado?.mensagem || 'O código informado não corresponde a nenhum laudo válido.'}</p>
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>MD Lab · Verificação de autenticidade</div>
      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Linha({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
      <span style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 600 }}>{rotulo}</span>
      <span style={{ fontSize: 13.5, color: '#0a1f1e', fontWeight: 600, fontFamily: mono ? 'monospace' : 'Outfit, sans-serif' }}>{valor}</span>
    </div>
  );
}

const tela: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdfa, #eef3f3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Outfit, sans-serif' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(13,148,136,.12)' };
