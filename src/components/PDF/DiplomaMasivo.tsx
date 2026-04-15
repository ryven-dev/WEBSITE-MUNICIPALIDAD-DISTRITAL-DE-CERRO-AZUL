import { forwardRef } from 'react';
import DiplomaDesign from './DiplomaDesign';
import type { AlumnoVacaciones } from '../../types';

interface DiplomaMasivoProps {
  alumnos: AlumnoVacaciones[];
}

const DiplomaMasivo = forwardRef<HTMLDivElement, DiplomaMasivoProps>(({ alumnos }, ref) => {
  return (
    <div ref={ref}>
      {alumnos.map((alumno) => (
        // El 'div' exterior asegura el salto de página en impresión
        <div key={alumno.id} style={{ pageBreakAfter: 'always' }} className="print-page-break">
            <DiplomaDesign nombre={alumno.nombre_completo_nino} />
        </div>
      ))}
    </div>
  );
});

export default DiplomaMasivo;