// src/pages/Social/BusEscolarPage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { RiBusLine, RiAddLine, RiSearchLine, RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import type { AlumnoBus } from '../../types';
import BusEscolarForm from '../../components/Forms/BusEscolarForm';


const BusEscolarPage = () => {
    const [data, setData] = useState<AlumnoBus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selected, setSelected] = useState<AlumnoBus | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const { data: res } = await supabase.from('social_bus_escolar').select('*').order('codigo', { ascending: false });
        if (res) setData(res);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = data.filter(i => 
        i.nombre_alumno.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.dni_alumno.includes(searchTerm) ||
        i.codigo?.includes(searchTerm.toUpperCase())
    );

    // Estilos Excel
    const headerStyle = "px-3 py-3 border border-gray-600 bg-[#27282F] text-gray-200 uppercase text-center font-bold tracking-wider text-[10px]";
    const cellStyle = "px-3 py-2 border border-gray-700 align-middle text-[11px]";

    return (
        <div className="p-4">
            <BusEscolarForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={fetchData} dataToEdit={selected} />

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><RiBusLine size={24}/></div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">Padrón Bus Municipal</h1>
                        <p className="text-gray-500 text-[11px] mt-1 uppercase">Control de Beneficiarios</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <RiSearchLine className="absolute left-2.5 top-2.5 text-gray-500"/>
                        <input type="text" placeholder="Buscar DNI, Nombre o Código..." className="w-full bg-[#1E1F25] border border-gray-600 rounded py-1.5 pl-8 pr-4 text-white text-xs outline-none focus:border-orange-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value.toUpperCase())} />
                    </div>
                    <button onClick={() => { setSelected(null); setIsFormOpen(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded flex items-center gap-2 font-bold text-xs transition-all">
                        <RiAddLine size={16}/> + INSCRIBIR
                    </button>
                </div>
            </div>

            <div className="bg-[#1E1F25] rounded border border-gray-600 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-700">
                        <thead>
                            <tr>
                                <th className={headerStyle}>Código</th>
                                <th className={headerStyle}>Nombre del Alumno</th>
                                <th className={headerStyle}>DNI</th>
                                <th className={headerStyle}>Edad/Sexo</th>
                                <th className={headerStyle}>Institución Educativa</th>
                                <th className={headerStyle}>Apoderado / Teléfono</th>
                                <th className={headerStyle}>DNI Apoderado</th>
                                <th className={headerStyle}>Dirección</th>
                                <th className={headerStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-10 border border-gray-700 italic text-gray-500 text-xs">Cargando base de datos...</td></tr>
                            ) : filtered.length > 0 ? filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors">
                                    <td className={cellStyle + " text-center font-mono font-bold text-orange-400"}>
                                        {item.codigo || '---'}
                                    </td>
                                    <td className={cellStyle + " font-bold text-white uppercase"}>{item.nombre_alumno}</td>
                                    <td className={cellStyle + " text-center font-mono"}>{item.dni_alumno}</td>
                                    <td className={cellStyle + " text-center leading-tight"}>
                                        <div className="text-white font-bold">{item.edad} Años</div>
                                        <div className="text-[9px] text-gray-500">{item.sexo}</div>
                                    </td>
                                    <td className={cellStyle + " uppercase"}>{item.colegio}</td>
                                    <td className={cellStyle}>
                                        <div className="font-bold text-gray-200 uppercase">{item.nombre_apoderado}</div>
                                        <div className="text-[10px] text-blue-400">{item.telefono_apoderado}</div>
                                    </td>
                                    <td className={cellStyle + " text-center font-mono"}>{item.dni_apoderado}</td>
                                    <td className={cellStyle + " text-[10px] uppercase text-gray-400"}>{item.direccion}</td>
                                    <td className={cellStyle}>
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setSelected(item); setIsFormOpen(true); }} className="text-blue-400 hover:text-blue-200"><RiPencilLine size={16}/></button>
                                            <button className="text-red-400 hover:text-red-300"><RiDeleteBinLine size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={9} className="text-center py-10 border border-gray-700 text-gray-500 text-xs uppercase tracking-widest">Sin registros encontrados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BusEscolarPage;