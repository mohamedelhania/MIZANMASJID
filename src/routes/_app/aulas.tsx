import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Plus, Users, GraduationCap, Trash2, Calendar, CheckCircle2,
  XCircle, Clock, FileText, ClipboardCheck, ArrowLeft, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/_app/aulas")({ component: AulasPage });

function AulasPage() {
  const { mosqueId, canAccessStudents, canModifyData } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"alumnos" | "tareas" | "examenes" | "asistencia" | "analiticas">("alumnos");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  if (!canAccessStudents()) return <Navigate to="/dashboard" />;

  const { data: classrooms, isLoading: loadingClassrooms } = useQuery({
    queryKey: ["classrooms", mosqueId],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data, error } = await supabase.from("classrooms").select("*").eq("mosque_id", mosqueId);
      if (error) console.error("Error fetching classrooms:", error);
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers", mosqueId],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data: rolesData, error } = await supabase.from("user_roles").select("user_id, role").eq("mosque_id", mosqueId).in("role", ["profesorado", "gerente", "super_admin"]);
      if (error || !rolesData || rolesData.length === 0) return [];
      
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(p => profilesMap.set(p.id, p));
      }
      
      return rolesData.map(r => ({
        user_id: r.user_id,
        profiles: profilesMap.get(r.user_id) || null
      }));
    },
    enabled: !!mosqueId,
  });

  const { data: students } = useQuery({
    queryKey: ["classroom-students", selectedClassroom],
    queryFn: async () => {
      if (!selectedClassroom) return [];
      const { data } = await supabase.from("students").select("*").eq("classroom_id", selectedClassroom);
      return data ?? [];
    },
    enabled: !!selectedClassroom,
  });

  const createClassroom = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classrooms").insert({ 
        name, 
        mosque_id: mosqueId!,
        teacher_id: teacherId || null 
      });
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["classrooms", mosqueId] }); 
      setName(""); setTeacherId(""); setShowForm(false); toast.success("Aula creada"); 
    },
  });

  const statusIcons: Record<string, React.ReactNode> = {
    present: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    absent: <XCircle className="h-4 w-4 text-red-500" />,
    late: <Clock className="h-4 w-4 text-amber-500" />,
  };

  const updateClassroom = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("classrooms").update(updates).eq("id", selectedClassroom);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classrooms", mosqueId] });
      toast.success("Aula actualizada");
    },
    onError: (e: any) => toast.error("Error: " + e.message)
  });

  const deleteClassroom = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classrooms").delete().eq("id", selectedClassroom);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classrooms", mosqueId] });
      setSelectedClassroom(null);
      toast.success("Aula eliminada");
    },
    onError: (e: any) => toast.error("Error: " + e.message)
  });

  const currentAula = classrooms?.find(c => c.id === selectedClassroom);

  const toggleMonth = (monthIndex: number) => {
    const current = currentAula?.inactive_months || [];
    const newMonths = current.includes(monthIndex) ? current.filter((m: number) => m !== monthIndex) : [...current, monthIndex];
    updateClassroom.mutate({ inactive_months: newMonths });
  };

  const monthsShort = t("months") as readonly string[];

  // IF NO CLASSROOM IS SELECTED, SHOW GRID OF AULAS
  if (!selectedClassroom) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" />
            {t("classrooms") as string}
          </h1>
          {canModifyData() && (
            <Button size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("add") as string}
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="p-4 animate-scale-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder={t("classroom_name") as string} value={name} onChange={e => setName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="">-- Seleccionar Profesor --</option>
                {(teachers ?? []).map((t: any) => (
                  <option key={t.user_id} value={t.user_id}>{t.profiles?.full_name || t.user_id}</option>
                ))}
              </select>

              <div className="flex gap-2 items-center">
                <Button size="sm" className="text-xs flex-1" disabled={!name || createClassroom.isPending} onClick={() => createClassroom.mutate()}>
                  {createClassroom.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : null} {t("save") as string}
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setShowForm(false)}>{t("cancel") as string}</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-slide-up">
          {loadingClassrooms ? (
             <Loader2 className="h-6 w-6 animate-spin text-primary col-span-full mx-auto" />
          ) : (
            (classrooms ?? []).map((c: any) => {
              const teacherName = c.teacher_id ? (teachers ?? []).find((t: any) => t.user_id === c.teacher_id)?.profiles?.full_name || "Profesor" : null;
              return (
                <Card key={c.id} className="p-4 cursor-pointer card-hover transition-all"
                  onClick={() => { setSelectedClassroom(c.id); setActiveTab("alumnos"); }}>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> {c.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {teacherName ? (
                      <span className="badge-teacher inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]">
                        <GraduationCap className="h-3 w-3" /> {teacherName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                        Sin profesor asignado
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
          {!loadingClassrooms && classrooms?.length === 0 && <p className="text-center text-sm text-muted-foreground col-span-full py-8">No hay aulas creadas.</p>}
        </div>
      </div>
    );
  }

  // --- CLASSROOM DETAILS VIEW (TABS) ---


  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedClassroom(null)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {currentAula?.name}
            </h2>
          </div>
          
          {canModifyData() && (
            <div className="flex items-center gap-2">
              <select 
                value={currentAula?.teacher_id || ""} 
                onChange={(e) => updateClassroom.mutate({ teacher_id: e.target.value || null })}
                className="text-xs px-2 py-1.5 rounded border border-border bg-background"
              >
                <option value="">-- Asignar Profesor --</option>
                {(teachers ?? []).map((t: any) => (
                  <option key={t.user_id} value={t.user_id}>{t.profiles?.full_name || t.user_id}</option>
                ))}
              </select>
              <Button size="sm" variant="destructive" className="h-8 gap-1 text-xs" onClick={() => {
                if (confirm("¿Estás seguro de que quieres eliminar esta aula? Los alumnos asignados se quedarán sin aula.")) {
                  deleteClassroom.mutate();
                }
              }}>
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </Button>
            </div>
          )}
        </div>

        {canModifyData() && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Meses de Vacaciones / Anulados (No se cobra cuota)</p>
            <div className="flex flex-wrap gap-1.5">
              {monthsShort.map((m, i) => {
                const isInactive = (currentAula?.inactive_months || []).includes(i + 1);
                return (
                  <button key={i} onClick={() => toggleMonth(i + 1)}
                    className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                      isInactive 
                        ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200" 
                        : "bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200"
                    }`}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        {[
          { id: "alumnos", label: "Alumnos", icon: <Users className="h-4 w-4" /> },
          { id: "tareas", label: "Tareas", icon: <FileText className="h-4 w-4" /> },
          { id: "examenes", label: "Exámenes", icon: <ClipboardCheck className="h-4 w-4" /> },
          { id: "asistencia", label: "Pasar lista", icon: <Calendar className="h-4 w-4" /> },
          { id: "analiticas", label: "Analíticas", icon: <BarChart className="h-4 w-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="mt-4">
        {activeTab === "alumnos" && <TabAlumnos students={students} />}
        {activeTab === "tareas" && <TabTareas mosqueId={mosqueId!} classroomId={selectedClassroom} canModify={canModifyData()} students={students} qc={qc} />}
        {activeTab === "examenes" && <TabExamenes mosqueId={mosqueId!} classroomId={selectedClassroom} canModify={canModifyData()} students={students} qc={qc} />}
        {activeTab === "asistencia" && (
          <TabAsistencia classroomId={selectedClassroom} mosqueId={mosqueId!} students={students} attendanceDate={attendanceDate} setAttendanceDate={setAttendanceDate} qc={qc} />
        )}
        {activeTab === "analiticas" && <TabAnaliticas students={students} classroomId={selectedClassroom} />}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS FOR TABS ---

function TabAlumnos({ students }: { students: any[] }) {
  return (
    <Card className="p-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Listado de Alumnos</h3>
      <div className="space-y-2">
        {(students ?? []).map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {s.first_name[0]}{s.last_name[0]}
            </div>
            <div>
              <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
              {s.contact_phone && <p className="text-[10px] text-muted-foreground">Tel: {s.contact_phone}</p>}
            </div>
          </div>
        ))}
        {(students ?? []).length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No hay alumnos en esta aula.</p>}
      </div>
    </Card>
  );
}

function TabTareas({ mosqueId, classroomId, canModify, students, qc }: any) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: homeworks } = useQuery({
    queryKey: ["homework", classroomId],
    queryFn: async () => {
      const { data } = await supabase.from("homework").select("*").eq("classroom_id", classroomId).order("due_date", { ascending: true });
      return data ?? [];
    },
    enabled: !!classroomId,
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("homework").insert({ mosque_id: mosqueId, classroom_id: classroomId, title, due_date: dueDate });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["homework"] }); setTitle(""); toast.success("Tarea creada"); }
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {canModify && (
        <Card className="p-4 bg-muted/10 border-dashed">
          <div className="flex gap-2 items-center">
            <input placeholder="Título de la tarea" value={title} onChange={e => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-36 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <Button size="sm" onClick={() => createTask.mutate()} disabled={!title}>Guardar</Button>
          </div>
        </Card>
      )}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {(homeworks ?? []).map((h: any) => (
          <Card key={h.id} className="p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-primary" /> {h.title}</h4>
            <p className="text-xs text-muted-foreground">Vence: {new Date(h.due_date).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TabExamenes({ mosqueId, classroomId, canModify, students, qc }: any) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: exams } = useQuery({
    queryKey: ["exams", classroomId],
    queryFn: async () => {
      const { data } = await supabase.from("exams").select("*").eq("classroom_id", classroomId).order("date", { ascending: false });
      return data ?? [];
    },
    enabled: !!classroomId,
  });

  const createExam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").insert({ mosque_id: mosqueId, classroom_id: classroomId, title, date });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); setTitle(""); toast.success("Examen creado"); }
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {canModify && (
        <Card className="p-4 bg-muted/10 border-dashed">
          <div className="flex gap-2 items-center">
            <input placeholder="Título del Examen" value={title} onChange={e => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-36 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <Button size="sm" onClick={() => createExam.mutate()} disabled={!title}>Guardar</Button>
          </div>
        </Card>
      )}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {(exams ?? []).map((e: any) => (
          <Card key={e.id} className="p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><ClipboardCheck className="h-4 w-4 text-primary" /> {e.title}</h4>
            <p className="text-xs text-muted-foreground">Fecha: {new Date(e.date).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TabAsistencia({ classroomId, mosqueId, students, attendanceDate, setAttendanceDate, qc }: any) {
  const { data: attendance } = useQuery({
    queryKey: ["attendance", classroomId, attendanceDate],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*").eq("classroom_id", classroomId).eq("date", attendanceDate);
      return data ?? [];
    },
    enabled: !!classroomId,
  });

  const markAttendance = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      const { error } = await supabase.from("attendance").upsert({ student_id: studentId, classroom_id: classroomId, mosque_id: mosqueId, date: attendanceDate, status: status as any }, { onConflict: "classroom_id,student_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });

  return (
    <Card className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">Pasar lista</h3>
        <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-border text-sm" />
      </div>
      <div className="space-y-2">
        {(students ?? []).map((s: any) => {
          const rec = (attendance ?? []).find((a: any) => a.student_id === s.id);
          const current = rec?.status || "none";
          return (
            <div key={s.id} className="flex items-center justify-between p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl">
              <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
              <div className="flex gap-1">
                {(["present", "absent", "late"] as const).map(st => (
                  <button key={st} onClick={() => markAttendance.mutate({ studentId: s.id, status: st })}
                    className={`p-1.5 rounded-lg transition-all ${current === st ? "bg-background shadow-sm ring-1 ring-border text-primary" : "hover:bg-muted text-muted-foreground"}`}>
                    {st === "present" ? <CheckCircle2 className="h-4 w-4" /> : st === "absent" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TabAnaliticas({ students, classroomId }: any) {
  // Mock data for analytics based on attendance and exams
  const chartData = [
    { name: "Lun", asistencia: 95 },
    { name: "Mar", asistencia: 85 },
    { name: "Mié", asistencia: 100 },
    { name: "Jue", asistencia: 90 },
    { name: "Vie", asistencia: 80 },
  ];

  return (
    <Card className="p-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Rendimiento del Aula (Asistencia Semanal %)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="asistencia" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Asistencia (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
