import { useState } from "react";
import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Search, Plus, Eye, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/alumnos/")({ component: AlumnosIndexPage });

function AlumnosIndexPage() {
  const { mosqueId, canAccessStudents, canModifyData } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [monthlyFee, setMonthlyFee] = useState<string>("0");
  const [classroomId, setClassroomId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [studentDni, setStudentDni] = useState("");
  const [tutorDni, setTutorDni] = useState("");
  const [studentDocType, setStudentDocType] = useState("DNI");
  const [tutorDocType, setTutorDocType] = useState("DNI");

  if (!canAccessStudents()) return <Navigate to="/dashboard" />;

  const { data: classrooms } = useQuery({
    queryKey: ["classrooms", mosqueId],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data } = await supabase.from("classrooms").select("*").eq("mosque_id", mosqueId);
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students", mosqueId],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data } = await supabase.from("students").select("*, classrooms(name)").eq("mosque_id", mosqueId).order("first_name");
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const { data: payments } = useQuery({
    queryKey: ["student-payments-all", mosqueId, year],
    queryFn: async () => {
      if (!mosqueId || !students || students.length === 0) return [];
      const { data } = await supabase
        .from("student_payments")
        .select("*")
        .eq("year", year)
        .in("student_id", students.map(s => s.id));
      return data ?? [];
    },
    enabled: !!mosqueId && !!students && students.length > 0,
  });

  const addStudent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").insert({ 
        first_name: firstName, 
        last_name: lastName, 
        mosque_id: mosqueId!,
        birth_date: birthDate || null,
        tutor_name: tutorName || null,
        contact_phone: contactPhone || null,
        classroom_id: classroomId || null,
        monthly_fee: Number(monthlyFee) || 0,
        student_dni: studentDni || null,
        tutor_dni: tutorDni || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      setFirstName(""); setLastName(""); setBirthDate(""); setTutorName(""); setContactPhone(""); setClassroomId(""); setMonthlyFee("0"); setStudentDni(""); setTutorDni(""); setShowForm(false);
      toast.success("✓");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("✓"); },
  });

  const togglePayment = useMutation({
    mutationFn: async ({ studentId, month, current, fee }: { studentId: string; month: number; current: boolean; fee: number }) => {
      if (current) {
        await supabase.from("student_payments").delete().eq("student_id", studentId).eq("year", year).eq("month", month);
      } else {
        await supabase.from("student_payments").insert({ student_id: studentId, year, month, paid: true, amount: fee });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-payments-all"] }),
  });

  const filtered = (students ?? []).filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (f: string, l: string) => `${f[0] || ""}${l[0] || ""}`.toUpperCase();

  const isMonthPaid = (studentId: string, m: number) => {
    const p = (payments ?? []).find(p => p.student_id === studentId && p.month === m);
    return p ? p.paid : false;
  };

  const months = t("months") as readonly string[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-primary" />
            {t("students") as string}
          </h1>
          <p className="text-sm text-muted-foreground">{(students ?? []).length} {t("students") as string}</p>
        </div>
        {canModifyData() && (
          <Button size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> {t("enroll_student") as string}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search") as string}
            className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
        </div>
        {/* Year toggle */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-12 text-center">{year}</span>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="p-4 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("first_name") as string}</label>
              <input placeholder={t("first_name") as string} value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("last_name") as string}</label>
              <input placeholder={t("last_name") as string} value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Fecha Nacimiento</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Documento Alumno</label>
              <div className="flex gap-2">
                <select value={studentDocType} onChange={e => setStudentDocType(e.target.value)} className="w-20 px-2 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="DNI">DNI</option>
                  <option value="NIE">NIE</option>
                </select>
                <input placeholder={studentDocType === "DNI" ? "12345678A" : "X1234567A"} value={studentDni} onChange={e => setStudentDni(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Tutor Legal</label>
              <input placeholder="Nombre del padre/madre" value={tutorName} onChange={e => setTutorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Documento Tutor</label>
              <div className="flex gap-2">
                <select value={tutorDocType} onChange={e => setTutorDocType(e.target.value)} className="w-20 px-2 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="DNI">DNI</option>
                  <option value="NIE">NIE</option>
                </select>
                <input placeholder={tutorDocType === "DNI" ? "12345678A" : "X1234567A"} value={tutorDni} onChange={e => setTutorDni(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Teléfono</label>
              <input placeholder="Ej. +34 600..." value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Cuota Mensual (€)</label>
              <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} min="0" step="1"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Aula Asignada</label>
              <select value={classroomId} onChange={e => setClassroomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="">-- Sin Aula --</option>
                {(classrooms ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setShowForm(false)}>{t("cancel") as string}</Button>
            <Button size="sm" className="text-xs gap-1 flex-1" disabled={!firstName || !lastName} onClick={() => {
              const dniRegex = /^\d{8}[A-Z]$/i;
              const nieRegex = /^[XYZ]\d{7}[A-Z]$/i;
              
              if (studentDni.trim()) {
                if (studentDocType === "DNI" && !dniRegex.test(studentDni.trim())) return toast.error("El DNI del alumno debe ser 8 números + letra.");
                if (studentDocType === "NIE" && !nieRegex.test(studentDni.trim())) return toast.error("El NIE del alumno debe ser X/Y/Z + 7 números + letra.");
              }
              if (tutorDni.trim()) {
                if (tutorDocType === "DNI" && !dniRegex.test(tutorDni.trim())) return toast.error("El DNI del tutor debe ser 8 números + letra.");
                if (tutorDocType === "NIE" && !nieRegex.test(tutorDni.trim())) return toast.error("El NIE del tutor debe ser X/Y/Z + 7 números + letra.");
              }

              addStudent.mutate();
            }}>
              {addStudent.isPending && <Loader2 className="h-3 w-3 animate-spin" />} {t("save") as string}
            </Button>
          </div>
        </Card>
      )}

      {/* Student list */}
      {isLoading ? (
        <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground animate-fade-in">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p>{t("no_students") as string}</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 card-hover overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="avatar-initials text-xs flex-shrink-0 relative">
                    {s.photo_url ? <img src={s.photo_url} alt="" className="h-full w-full rounded-full object-cover absolute inset-0 cursor-pointer" onClick={() => setSelectedPhoto(s.photo_url || null)} /> : getInitials(s.first_name, s.last_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(s as any).classrooms?.name || t("no_classrooms") as string}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link to="/alumnos/$studentId" params={{ studentId: s.id }} className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  {canModifyData() && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                      onClick={() => { if (confirm(t("confirm_delete") as string)) deleteStudent.mutate(s.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              

            </Card>
          ))}
        </div>
      )}
      {/* Photo Viewer Overlay */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full h-full p-2 bg-card rounded-2xl shadow-xl overflow-hidden flex items-center justify-center border border-border">
            <button 
              className="absolute top-4 right-4 h-8 w-8 bg-background/50 backdrop-blur-md rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors z-10 border border-border shadow-sm"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={selectedPhoto} 
              alt="Foto del alumno" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
