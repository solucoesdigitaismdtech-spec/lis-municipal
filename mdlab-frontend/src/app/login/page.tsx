'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { authApi, tokenStorage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Se já estiver logado, vai direto pro dashboard
  useEffect(() => {
    if (tokenStorage.getAccess()) {
      router.push('/dashboard');
    }
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!email || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      const resp = await authApi.login(email, senha);
      tokenStorage.set(resp.accessToken, resp.refreshToken, resp.user);
      router.push('/dashboard');
    } catch (err: any) {
      setErro(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={estilos.container}>
      {/* ─── Painel esquerdo: branding ─── */}
      <div style={estilos.painelEsquerdo}>
        <div style={estilos.gridBg} />
        <div style={{ ...estilos.orbe, ...estilos.orbe1 }} />
        <div style={{ ...estilos.orbe, ...estilos.orbe2 }} />

        {/* Logo */}
        <div style={estilos.logoArea}>
          <img src="/logo-mdlab-branca.svg" alt="MD Lab" style={{ height: 64 }} />
        </div>

        {/* Frase de impacto */}
        <div style={estilos.fraseArea}>
          <h2 style={estilos.fraseTitulo}>
            A gestão do seu<br />
            <span style={estilos.fraseDestaque}>laboratório municipal</span><br />
            em um só lugar.
          </h2>
          <p style={estilos.fraseTexto}>
            Do agendamento ao laudo digital. Integração com e-SUS,
            segurança LGPD e resultados acessíveis ao paciente.
          </p>
        </div>

        {/* Features */}
        <div style={estilos.features}>
          <div style={estilos.feature}><span style={estilos.dot} /> Integração e-SUS</div>
          <div style={estilos.feature}><span style={estilos.dot} /> Segurança LGPD</div>
          <div style={estilos.feature}><span style={estilos.dot} /> Laudo digital</div>
        </div>
      </div>

      {/* ─── Painel direito: formulário ─── */}
      <div style={estilos.painelDireito}>
        <div style={estilos.formBox}>
          <div style={estilos.formTopo}>
            <div style={estilos.saudacao}>Bem-vindo de volta</div>
            <h3 style={estilos.formTitulo}>Acesse sua conta</h3>
            <p style={estilos.formSub}>Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={entrar}>
            <div style={estilos.campo}>
              <label style={estilos.label}>E-mail</label>
              <div style={estilos.inputWrap}>
                <Mail size={17} style={estilos.inputIcone} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@municipio.gov.br"
                  style={estilos.input}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>Senha</label>
              <div style={estilos.inputWrap}>
                <Lock size={17} style={estilos.inputIcone} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  style={estilos.input}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {erro && <div style={estilos.erro}>{erro}</div>}

            <button type="submit" disabled={carregando} style={estilos.btn}>
              {carregando ? (
                <><Loader2 size={18} style={{ animation: 'girar 1s linear infinite' }} /> Entrando...</>
              ) : (
                <>Entrar no sistema <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={estilos.seloSeg}>
            <ShieldCheck size={14} /> Conexão segura e criptografada
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos (inline para manter tudo em um arquivo) ────────────
const estilos: Record<string, React.CSSProperties> = {
  container: { display: 'flex', minHeight: '100vh', overflow: 'hidden' },

  painelEsquerdo: {
    flex: 1,
    background:
      'radial-gradient(circle at 30% 20%, rgba(20,184,166,.25) 0%, transparent 45%), radial-gradient(circle at 70% 80%, rgba(79,70,229,.2) 0%, transparent 45%), linear-gradient(135deg, #042f2e 0%, #0a1f1e 60%, #0a1428 100%)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 50,
    overflow: 'hidden',
  },
  gridBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(45,212,191,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.06) 1px, transparent 1px)',
    backgroundSize: '44px 44px',
    maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 75%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 75%)',
  },
  orbe: { position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.5 },
  orbe1: { width: 280, height: 280, background: '#14b8a6', top: -60, right: -40, animation: 'flutua 8s ease-in-out infinite' },
  orbe2: { width: 220, height: 220, background: '#4f46e5', bottom: 40, left: -30, animation: 'flutua 10s ease-in-out infinite reverse' },

  logoArea: { position: 'relative', zIndex: 2 },

  fraseArea: { position: 'relative', zIndex: 2 },
  fraseTitulo: { color: '#fff', fontSize: 38, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 },
  fraseDestaque: {
    background: 'linear-gradient(120deg, #5eead4, #818cf8)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  fraseTexto: { color: '#94a3b8', fontSize: 15, lineHeight: 1.7, maxWidth: 400 },

  features: { position: 'relative', zIndex: 2, display: 'flex', gap: 24, flexWrap: 'wrap' },
  feature: { display: 'flex', alignItems: 'center', gap: 8, color: '#5eead4', fontSize: 13 },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 10px #2dd4bf' },

  painelDireito: {
    width: 480,
    background: '#fbfffe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  formBox: { width: '100%', maxWidth: 360 },
  formTopo: { marginBottom: 36 },
  saudacao: { fontSize: 13, color: '#0d9488', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  formTitulo: { fontSize: 28, fontWeight: 700, color: '#0a1f1e' },
  formSub: { color: '#64748b', fontSize: 14, marginTop: 6 },

  campo: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#042f2e', marginBottom: 8 },
  inputWrap: { position: 'relative' },
  inputIcone: { position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    fontSize: 15,
    color: '#0a1f1e',
    background: '#fff',
    outline: 'none',
  },

  erro: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 13,
    marginBottom: 16,
  },

  btn: {
    width: '100%',
    padding: 15,
    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'Sora, sans-serif',
    marginTop: 8,
    boxShadow: '0 8px 24px rgba(13,148,136,.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  seloSeg: { marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#94a3b8' },
};
