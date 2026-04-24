// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { 
  RiUser3Line, 
  RiLockPasswordLine, 
  RiEyeLine, 
  RiEyeOffLine, 
  RiArrowRightLine,
  RiBuilding2Line 
} from 'react-icons/ri';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. EFECTO: Cargar usuario guardado al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('lastUser');
    if (savedUser) {
      setEmail(savedUser);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
     
      const emailFinal = email.includes('@') 
        ? email 
        : `${email}@sgc.com`;

      console.log("Iniciando sesión con:", emailFinal); 
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFinal, 
        password,
      });

      if (error) throw error;

      if (data.session) {
        
        const userToSave = emailFinal.endsWith('@sgc.com') ? emailFinal.split('@')[0] : emailFinal;
        localStorage.setItem('lastUser', userToSave);

        toast.success(`Bienvenido al Sistema`, {
            style: { background: '#333', color: '#fff' },
            icon: '👋',
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Usuario o contraseña incorrectos.', {
        style: { background: '#EF4444', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#13141a]">
      
      {/* === LADO IZQUIERDO (Imagen) === */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')" 
            }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13141a] via-[#13141a]/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-md w-fit rounded-2xl border border-white/10">
                <RiBuilding2Line size={40} className="text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
                Gestión Municipal <br />
                <span className="text-blue-400">Eficiente y Segura.</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-md">
                Plataforma integral para la administración de licencias, fiscalización y desarrollo económico del distrito.
            </p>
        </div>
      </div>

      {/* === LADO DERECHO (Formulario) === */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
            
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                    SIGEM
                </h2>
                <p className="text-gray-400">Sistema Integrado de Gestión Municipal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                
                {/* Input Usuario */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">Usuario</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <RiUser3Line className="text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        </div>
                        <input
                            type="text" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1E1F25] text-white pl-12 pr-4 py-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
                            placeholder="Ej: nombre.apellido"
                            required
                        />
                    </div>
                </div>

                {/* Input Contraseña */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-medium text-gray-300">Contraseña</label>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <RiLockPasswordLine className="text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1E1F25] text-white pl-12 pr-12 py-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Iniciando...</span>
                        </>
                    ) : (
                        <>
                            <span>Iniciar Sesión</span>
                            <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

            </form>

            <div className="mt-12 text-center">
                <p className="text-gray-500 text-sm">
                    © {new Date().getFullYear()} Municipalidad Distrital de Cerro Azul
                    <br />
                    Oficina de Informática y Estadísticas
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;