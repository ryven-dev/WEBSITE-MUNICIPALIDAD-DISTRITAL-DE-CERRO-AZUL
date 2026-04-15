// src/components/Dashboard/StatCard.tsx
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  // Se han añadido 'orange', 'indigo' y 'red' para soportar todos los módulos
  color: 'blue' | 'yellow' | 'green' | 'pink' | 'purple' | 'orange' | 'indigo' | 'red';
  subtext?: string;
}

const StatCard = ({ icon, title, value, color, subtext }: StatCardProps) => {
  
  // Configuraciones de color con gradientes y bordes sutiles
  const styles = {
    blue:   "bg-gradient-to-br from-blue-900/40 to-[#1E1F25] border-blue-500/20 text-blue-400",
    yellow: "bg-gradient-to-br from-yellow-900/40 to-[#1E1F25] border-yellow-500/20 text-yellow-400",
    green:  "bg-gradient-to-br from-emerald-900/40 to-[#1E1F25] border-emerald-500/20 text-emerald-400",
    pink:   "bg-gradient-to-br from-pink-900/40 to-[#1E1F25] border-pink-500/20 text-pink-400",
    purple: "bg-gradient-to-br from-purple-900/40 to-[#1E1F25] border-purple-500/20 text-purple-400",
    orange: "bg-gradient-to-br from-orange-900/40 to-[#1E1F25] border-orange-500/20 text-orange-400",
    indigo: "bg-gradient-to-br from-indigo-900/40 to-[#1E1F25] border-indigo-500/20 text-indigo-400",
    red:    "bg-gradient-to-br from-red-900/40 to-[#1E1F25] border-red-500/20 text-red-400",
  };

  const activeStyle = styles[color] || styles.blue;

  // Extraemos la clase de color de texto para aplicarla al icono pequeño
  const textColor = activeStyle.split(' ').pop();

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-black/50 ${activeStyle}`}>
      
      {/* Icono Gigante de Fondo (Efecto de marca de agua) */}
      <div className="absolute -right-6 -bottom-6 opacity-10 text-[100px] pointer-events-none text-white rotate-12 transition-transform group-hover:rotate-0 duration-500">
        {icon}
      </div>

      <div className="relative z-10">
        {/* Encabezado de la tarjeta */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 ${textColor}`}>
            {icon}
          </div>
          <h4 className="text-gray-400 text-[11px] font-bold tracking-widest uppercase">{title}</h4>
        </div>

        {/* Valor Principal */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tight">{value}</span>
        </div>

        {/* Subtexto */}
        {subtext && (
          <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
            {subtext}
          </p>
        )}
      </div>

      {/* Brillo decorativo superior */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  );
};

export default StatCard;