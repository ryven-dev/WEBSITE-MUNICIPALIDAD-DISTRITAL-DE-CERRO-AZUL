import { Link } from 'react-router-dom';
import {
  RiBookOpenLine,
  RiFileList3Line,
  RiBookletLine,
  RiRefreshLine,
  RiAlertLine,
  RiBarChart2Line,
} from 'react-icons/ri';

const cards = [
  {
    title: 'Inventario de libros',
    description: 'Gestionar el registro de libros y textos de la biblioteca municipal.',
    to: '/social/biblioteca/inventario',
    icon: RiBookOpenLine,
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    title: 'Solicitudes de reserva',
    description: 'Revisar, aprobar o rechazar solicitudes realizadas por ciudadanos.',
    to: '/social/biblioteca/solicitudes',
    icon: RiFileList3Line,
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    title: 'Préstamos y entregas',
    description: 'Registrar entregas de libros, devoluciones y control de plazos.',
    to: '/social/biblioteca/prestamos',
    icon: RiBookletLine,
    color: 'bg-green-500/20 text-green-400',
  },
  {
    title: 'Renovaciones',
    description: 'Atender solicitudes de ampliación del plazo de préstamo.',
    to: '/social/biblioteca/renovaciones',
    icon: RiRefreshLine,
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    title: 'Incidencias',
    description: 'Registrar deterioros, pérdidas o devoluciones fuera de plazo.',
    to: '/social/biblioteca/incidencias',
    icon: RiAlertLine,
    color: 'bg-red-500/20 text-red-400',
  },
  {
    title: 'Reportes',
    description: 'Consultar estadísticas de solicitudes, préstamos e incidencias.',
    to: '/social/biblioteca/reportes',
    icon: RiBarChart2Line,
    color: 'bg-cyan-500/20 text-cyan-400',
  },
];

export default function BaseDashboardPage() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
            <RiBookOpenLine size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              B.A.S.E.
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              Biblioteca: Administración de Solicitudes y Entregas
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mt-4 max-w-3xl">
          Módulo integrado al SIGEM para la gestión del inventario bibliográfico,
          solicitudes ciudadanas, préstamos, devoluciones, renovaciones,
          incidencias y reportes de la Biblioteca Municipal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.to}
              to={card.to}
              className="bg-[#1E1F25] border border-gray-800 rounded-2xl p-5 hover:bg-[#27282F] transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                <Icon size={24} />
              </div>

              <h2 className="text-white font-bold mb-2 group-hover:text-blue-300 transition-colors">
                {card.title}
              </h2>

              <p className="text-gray-500 text-sm leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}