import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { transliterateToArabic } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{ id: string; type: "student" | "user"; title: string; subtitle: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { mosqueId } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2 || !mosqueId) {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      const transliterated = transliterateToArabic(query);
      
      // Search students
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("mosque_id", mosqueId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,first_name.ilike.%${transliterated}%,last_name.ilike.%${transliterated}%`)
        .limit(5);

      // Search users/teachers
      const { data: users } = await supabase
        .from("user_roles")
        .select("user_id, role, profiles(full_name)")
        .eq("mosque_id", mosqueId)
        .limit(10);
      
      const filteredUsers = (users ?? []).filter(u => {
        const name = (u.profiles?.full_name || "").toLowerCase();
        return name.includes(query.toLowerCase()) || name.includes(transliterated);
      }).slice(0, 5);

      const combined = [
        ...(students ?? []).map(s => ({
          id: s.id,
          type: "student" as const,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: "Alumno"
        })),
        ...filteredUsers.map(u => ({
          id: u.user_id,
          type: "user" as const,
          title: u.profiles?.full_name || "Usuario",
          subtitle: t(u.role as any) as string
        }))
      ];
      
      setResults(combined);
      setLoading(false);
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, mosqueId]);

  return (
    <div className="relative w-full max-w-xs z-50">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          value={query} 
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={t("search") as string + "..."}
          className="w-full ps-9 pe-3 py-1.5 rounded-full border border-border bg-muted/30 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {loading && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {isOpen && query.length >= 2 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 w-full max-w-sm bg-background border border-border shadow-xl rounded-xl overflow-hidden z-50 py-1">
            {results.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground p-3 text-center">No hay resultados</p>
            ) : (
              results.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    if (r.type === "student") {
                      navigate({ to: "/alumnos/$studentId", params: { studentId: r.id } });
                    } else {
                      navigate({ to: "/usuarios" });
                    }
                  }}
                  className="w-full text-start px-4 py-2 hover:bg-muted/50 transition-colors flex flex-col"
                >
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{r.subtitle}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
