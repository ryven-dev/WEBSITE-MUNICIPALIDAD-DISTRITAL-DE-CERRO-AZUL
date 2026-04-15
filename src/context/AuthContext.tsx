// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Definimos roles y áreas
type UserRole = 'admin' | 'visor' | null;
type UserArea = 'ADMIN' | 'COMERCIALIZACION' | 'FISCALIZACION' | 'GERENCIA' | 'DESARROLLO_SOCIAL' | null;

interface AuthContextType {
  session: Session | null;
  userRole: UserRole;
  userArea: UserArea; // <--- IMPORTANTE: Este campo debe existir
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userArea, setUserArea] = useState<UserArea>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setUserArea(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // AQUÍ ESTÁ LA CLAVE: Pedimos 'role' Y TAMBIÉN 'area'
      const { data, error } = await supabase
        .from('profiles')
        .select('role, area') 
        .eq('id', userId)
        .single();

      if (error || !data) {
        setUserRole('visor');
        setUserArea('COMERCIALIZACION'); // Default seguro
      } else {
        setUserRole(data.role as UserRole);
        setUserArea(data.area as UserArea);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserArea(null);
    setSession(null);
  };

  const value = { session, userRole, userArea, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};