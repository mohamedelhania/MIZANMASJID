import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, BookOpen, Star, MessageSquare, CreditCard, Camera,
  Plus, Trash2, Loader2, ClipboardList, Calendar,
} from "lucide-react";

export const Route = createFileRoute("/_app/alumnos/$studentId")({ component: StudentDetailPage });

function StudentDetailPage() {
  const { studentId } = Route.useParams();
  const { user, canModifyData, formatCurrency, mosqueId } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"profile" | "grades" | "notes" | "payments" | "assignments">("profile");

  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*, classrooms(name, inactive_months)").eq("id", studentId).single();
      if (error) {
        console.error("Error fetching student with inactive_months (SQL might be missing):", error);
        // Fallback if the column is missing
        const fallback = await supabase.from("students").select("*, classrooms(name)").eq("id", studentId).single();
        return fallback.data;
      }
      return data;
    },
  });

  const { data: grades } = useQuery({
    queryKey: ["grades", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("student_grades").select("*").eq("student_id", studentId).order("year", { ascending: false });
      return data ?? [];
    },
    enabled: tab === "grades",
  });

  const { data: notes } = useQuery({
    queryKey: ["notes", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("student_notes").select("*").eq("student_id", studentId).order("note_date", { ascending: false });
      return data ?? [];
    },
    enabled: tab === "notes",
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("student_payments").select("*").eq("student_id", studentId).order("year", { ascending: false });
      return data ?? [];
    },
    enabled: tab === "payments",
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("student_assignments").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: tab === "assignments",
  });

  // Photo upload
  const uploadPhoto = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${mosqueId}/${studentId}.${ext}`;
    const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);
    await supabase.from("students").update({ photo_url: publicUrl }).eq("id", studentId);
    qc.invalidateQueries({ queryKey: ["student", studentId] });
    toast.success("✓");
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        student_dni: editForm.student_dni || null,
        date_of_birth: editForm.date_of_birth || null,
        tutor_name: editForm.tutor_name || null,
        tutor_dni: editForm.tutor_dni || null,
        contact_phone: editForm.contact_phone || null,
        address: editForm.address || null,
        monthly_fee: editForm.monthly_fee || 0
      }).eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setIsEditingProfile(false);
      toast.success("✓ Perfil actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutations
  const upsertGrade = useMutation({
    mutationFn: async ({ year, trimester, grade }: { year: number; trimester: number; grade: number | null }) => {
      await supabase.from("student_grades").upsert({ student_id: studentId, year, trimester, grade }, { onConflict: "student_id,year,trimester" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }),
  });

  const [noteText, setNoteText] = useState("");
  const addNote = useMutation({
    mutationFn: async () => {
      await supabase.from("student_notes").insert({ student_id: studentId, content: noteText, created_by: user?.id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setNoteText(""); toast.success("✓"); },
  });

  const togglePayment = useMutation({
    mutationFn: async ({ year, month, paid, amount }: { year: number; month: number; paid: boolean; amount: number }) => {
      const now = new Date();
      if (paid) {
        await supabase.from("student_payments").upsert({ student_id: studentId, year, month, paid, amount, payment_year: now.getFullYear(), payment_month: now.getMonth() + 1 }, { onConflict: "student_id,year,month" });
      } else {
        // Just delete or set null. Upserting with null is fine since it's paid=false
        await supabase.from("student_payments").upsert({ student_id: studentId, year, month, paid, amount, payment_year: null, payment_month: null }, { onConflict: "student_id,year,month" });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const [asgTitle, setAsgTitle] = useState("");
  const addAssignment = useMutation({
    mutationFn: async () => {
      await supabase.from("student_assignments").insert({ student_id: studentId, title: asgTitle, created_by: user?.id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); setAsgTitle(""); toast.success("✓"); },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => { await supabase.from("student_notes").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("✓"); },
  });

  if (!student) return <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  const TABS = [
    { key: "profile", icon: <User className="h-4 w-4" />, label: t("profile") },
    { key: "grades", icon: <Star className="h-4 w-4" />, label: t("grades") },
    { key: "notes", icon: <MessageSquare className="h-4 w-4" />, label: t("notes") },
    { key: "payments", icon: <CreditCard className="h-4 w-4" />, label: t("monthly_payment") },
    { key: "assignments", icon: <ClipboardList className="h-4 w-4" />, label: t("assignments") },
  ];
  const currentYear = new Date().getFullYear();
  const monthsShort = t("months") as readonly string[];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Link to="/alumnos" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> {t("back") as string}
      </Link>

      {/* Student header */}
      <Card className="p-5 animate-slide-up">
        <div className="flex items-center gap-4">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            {student.photo_url ? (
              <img src={student.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover border-2 border-border" />
            ) : (
              <div className="avatar-initials h-16 w-16 text-lg">
                {(student.first_name[0] + student.last_name[0]).toUpperCase()}
              </div>
            )}
            {canModifyData() && (
              <label className="absolute -bottom-1 -end-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer shadow-md">
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold">{student.first_name} {student.last_name}</h2>
            <p className="text-xs text-muted-foreground">{(student as any).classrooms?.name || t("no_classrooms") as string}</p>
            {student.date_of_birth && <p className="text-xs text-muted-foreground">{t("dob") as string}: {student.date_of_birth}</p>}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 animate-slide-up">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              tab === tb.key ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:bg-muted/50"
            }`}>
            {tb.icon} {tb.label as string}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile" && (
        <Card className="p-4 animate-fade-in relative">
          {!isEditingProfile ? (
            <>
              {canModifyData() && (
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-8 text-xs" onClick={() => {
                  const getDocType = (doc: string) => (!doc ? "DNI" : /^[XYZ]/i.test(doc.trim()) ? "NIE" : "DNI");
                  setEditForm({ 
                    ...student,
                    student_doc_type: getDocType(student.student_dni),
                    tutor_doc_type: getDocType(student.tutor_dni)
                  });
                  setIsEditingProfile(true);
                }}>
                  Editar
                </Button>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                <div><p className="text-[10px] text-muted-foreground">{t("first_name") as string}</p><p className="font-medium">{student.first_name}</p></div>
                <div><p className="text-[10px] text-muted-foreground">{t("last_name") as string}</p><p className="font-medium">{student.last_name}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Documento Alumno</p><p className="font-medium">{student.student_dni || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">{t("dob") as string}</p><p className="font-medium">{student.date_of_birth || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Tutor Legal</p><p className="font-medium">{student.tutor_name || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Documento Tutor</p><p className="font-medium">{student.tutor_dni || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Teléfono</p><p className="font-medium">{student.contact_phone || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">{t("address") as string}</p><p className="font-medium">{student.address || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">{t("enrollment_date") as string}</p><p className="font-medium">{student.enrollment_date}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Cuota Mensual</p><p className="font-medium">{formatCurrency(student.monthly_fee)}</p></div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Nombre</label>
                <input value={editForm.first_name || ""} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Apellido</label>
                <input value={editForm.last_name || ""} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Documento Alumno</label>
                <div className="flex gap-2">
                  <select value={editForm.student_doc_type || "DNI"} onChange={e => setEditForm(f => ({ ...f, student_doc_type: e.target.value }))} className="w-20 px-2 py-1.5 rounded-lg border text-sm">
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                  </select>
                  <input value={editForm.student_dni || ""} onChange={e => setEditForm(f => ({ ...f, student_dni: e.target.value.toUpperCase() }))} className="flex-1 px-2 py-1.5 rounded-lg border text-sm min-w-0" placeholder={editForm.student_doc_type === "DNI" ? "12345678A" : "X1234567A"} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Fecha Nacimiento</label>
                <input type="date" value={editForm.date_of_birth || ""} onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Tutor Legal</label>
                <input value={editForm.tutor_name || ""} onChange={e => setEditForm(f => ({ ...f, tutor_name: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Documento Tutor</label>
                <div className="flex gap-2">
                  <select value={editForm.tutor_doc_type || "DNI"} onChange={e => setEditForm(f => ({ ...f, tutor_doc_type: e.target.value }))} className="w-20 px-2 py-1.5 rounded-lg border text-sm">
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                  </select>
                  <input value={editForm.tutor_dni || ""} onChange={e => setEditForm(f => ({ ...f, tutor_dni: e.target.value.toUpperCase() }))} className="flex-1 px-2 py-1.5 rounded-lg border text-sm min-w-0" placeholder={editForm.tutor_doc_type === "DNI" ? "12345678A" : "X1234567A"} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Teléfono</label>
                <input value={editForm.contact_phone || ""} onChange={e => setEditForm(f => ({ ...f, contact_phone: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Dirección</label>
                <input value={editForm.address || ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Cuota Mensual (€)</label>
                <input type="number" value={editForm.monthly_fee || 0} onChange={e => setEditForm(f => ({ ...f, monthly_fee: Number(e.target.value) }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" />
              </div>
              
              <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                <Button size="sm" onClick={() => {
                  const dniRegex = /^\d{8}[A-Z]$/i;
                  const nieRegex = /^[XYZ]\d{7}[A-Z]$/i;
                  
                  const sDni = (editForm.student_dni || "").trim();
                  if (sDni) {
                    if (editForm.student_doc_type === "DNI" && !dniRegex.test(sDni)) return toast.error("DNI de alumno inválido.");
                    if (editForm.student_doc_type === "NIE" && !nieRegex.test(sDni)) return toast.error("NIE de alumno inválido.");
                  }
                  
                  const tDni = (editForm.tutor_dni || "").trim();
                  if (tDni) {
                    if (editForm.tutor_doc_type === "DNI" && !dniRegex.test(tDni)) return toast.error("DNI de tutor inválido.");
                    if (editForm.tutor_doc_type === "NIE" && !nieRegex.test(tDni)) return toast.error("NIE de tutor inválido.");
                  }
                  
                  updateProfile.mutate();
                }} disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Guardar
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === "grades" && (
        <Card className="p-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">{t("grades") as string} {currentYear}</h3>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(tri => {
              const g = (grades ?? []).find(x => x.year === currentYear && x.trimester === tri);
              return (
                <div key={tri} className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("trimester") as string} {tri}</p>
                  <input type="number" min="0" max="10" step="0.5" disabled={!canModifyData()}
                    value={g?.grade ?? ""} placeholder="—"
                    onChange={e => upsertGrade.mutate({ year: currentYear, trimester: tri, grade: e.target.value ? Number(e.target.value) : null })}
                    className="w-full text-xl font-bold bg-transparent border-none p-0 text-center focus:ring-0 disabled:text-foreground" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === "notes" && (
        <Card className="p-4 animate-fade-in">
          {canModifyData() && (
            <div className="flex gap-2 mb-3">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder={t("note_placeholder") as string}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              <Button size="sm" className="text-xs" disabled={!noteText} onClick={() => addNote.mutate()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {(notes ?? []).map(n => (
              <div key={n.id} className="p-3 bg-muted/30 rounded-xl flex justify-between">
                <div><p className="text-sm">{n.content}</p><p className="text-[10px] text-muted-foreground mt-1">{n.note_date}</p></div>
                {canModifyData() && <button onClick={() => deleteNote.mutate(n.id)} className="text-destructive/50 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>}
              </div>
            ))}
            {(notes ?? []).length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">{t("nothing_yet") as string}</p>}
          </div>
        </Card>
      )}

      {tab === "payments" && (
        <Card className="p-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">{t("monthly_payment") as string} {currentYear}</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1;
              const pay = (payments ?? []).find(p => p.year === currentYear && p.month === monthNum);
              const isPaid = pay?.paid ?? false;
              const isInactive = ((student as any)?.classrooms?.inactive_months || []).includes(monthNum);

              return (
                <button key={i} disabled={!canModifyData() || isInactive}
                  onClick={() => {
                    if (isInactive) return;
                    togglePayment.mutate({ year: currentYear, month: monthNum, paid: !isPaid, amount: Number(pay?.amount ?? 0) });
                  }}
                  className={`p-2 rounded-xl text-center transition-all ${
                    isInactive 
                      ? "bg-amber-100 text-amber-700 border border-amber-300 opacity-80 cursor-not-allowed"
                      : isPaid 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                        : "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
                  } ${!canModifyData() ? "cursor-default" : ""}`}>
                  <p className="text-[10px] font-medium">{monthsShort[i]}</p>
                  <p className="text-lg">{isInactive ? "—" : isPaid ? "✓" : "·"}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === "assignments" && (
        <Card className="p-4 animate-fade-in">
          {canModifyData() && (
            <div className="flex gap-2 mb-3">
              <input value={asgTitle} onChange={e => setAsgTitle(e.target.value)} placeholder={t("title") as string}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              <Button size="sm" className="text-xs" disabled={!asgTitle} onClick={() => addAssignment.mutate()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {(assignments ?? []).map(a => (
              <div key={a.id} className="p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.grade != null && <span className="text-xs font-bold text-primary">{a.grade}</span>}
                </div>
                {a.due_date && <p className="text-[10px] text-muted-foreground">{t("due_date") as string}: {a.due_date}</p>}
              </div>
            ))}
            {(assignments ?? []).length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">{t("nothing_yet") as string}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
