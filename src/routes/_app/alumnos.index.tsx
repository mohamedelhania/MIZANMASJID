import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useConfirm } from "@/providers/ConfirmDialogProvider";
import React, { useState } from "react";
import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Search, Plus, Eye, Trash2, Loader2, ChevronLeft, ChevronRight, Download,
} from "lucide-react";

export const Route = createFileRoute("/_app/alumnos/")({ component: AlumnosIndexPage });

function AlumnosIndexPage() {
  const confirm = useConfirm();
  const { mosqueId, canAccessStudents, canModifyData, role } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfFields, setPdfFields] = useState({
    number: true,
    name: true,
    lastname: true,
    dni: true,
    classroom: true,
    fee: true,
    payments: false,
    onlyDebtors: false
  });

  const generatePdf = async () => {
    const isLandscape = pdfFields.payments;
    const doc = new jsPDF(isLandscape ? "landscape" : "portrait");
    
    // Fetch Mosque info
    const { data: mosque } = await supabase.from("mosques").select("*").eq("id", mosqueId).single();
    
    let headerY = 20;

    // Add Logo
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      if (base64) {
        doc.addImage(base64 as string, "PNG", 14, 10, 25, 25);
      }
    } catch (e) { console.error(e); }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 163, 119); // MizanMasjid green
    doc.text(mosque?.name || "MizanMasjid", 45, 22);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Listado de Alumnos", 45, 30);

    headerY = 45;

    // Build headers
    const head = [];
    if (pdfFields.number) head.push("Nº");
    if (pdfFields.name) head.push("Nombre");
    if (pdfFields.lastname) head.push("Apellidos");
    if (pdfFields.dni) head.push("DNI");
    if (pdfFields.classroom) head.push("Aula");
    if (pdfFields.fee) head.push("Cuota");
    
    const monthNames = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    if (pdfFields.payments) {
      head.push(...monthNames);
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let studentsToExport = filtered;
    
    if (pdfFields.onlyDebtors) {
      studentsToExport = filtered.filter(s => {
        const paidThisYear = (payments || []).filter(p => p.student_id === s.id && p.year === currentYear && p.paid);
        return paidThisYear.length < currentMonth; // Simple debtor logic
      });
    }

    const body = studentsToExport.map(s => {
      const row = [];
      if (pdfFields.number) row.push(s.enrollment_number || "-");
      if (pdfFields.name) row.push(s.first_name);
      if (pdfFields.lastname) row.push(s.last_name);
      if (pdfFields.dni) row.push(s.student_dni || "-");
      if (pdfFields.classroom) row.push(s.classrooms?.name || "-");
      if (pdfFields.fee) row.push(s.monthly_fee ? `${s.monthly_fee}€` : "0€");
      
      if (pdfFields.payments) {
        const paidThisYear = (payments || []).filter(p => p.student_id === s.id && p.year === currentYear && p.paid).map(p => p.month);
        for (let i = 1; i <= 12; i++) {
          row.push(paidThisYear.includes(i) ? "Pagado" : "No");
        }
      }
      return row;
    });

    autoTable(doc, {
      startY: headerY,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 163, 119], halign: 'center' },
      didParseCell: (data) => {
        if (pdfFields.payments && data.section === 'body') {
          const colIndex = data.column.index;
          const monthsStartIndex = head.length - 12;
          if (colIndex >= monthsStartIndex) {
            data.cell.styles.halign = 'center';
            if (data.cell.raw === 'Pagado') {
              data.cell.text = [''];
              data.cell.styles.fillColor = [187, 247, 208];
            } else if (data.cell.raw === 'No') {
              data.cell.text = [''];
              data.cell.styles.fillColor = [254, 202, 202];
            }
          }
        }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (mosque?.bank_account) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50);
        const bankText = `Cuenta de la Mezquita: ${mosque.bank_account}`;
        const textWidth = doc.getStringUnitWidth(bankText) * 11 / doc.internal.scaleFactor;
        const pageWidth = doc.internal.pageSize.width;
        doc.text(bankText, (pageWidth - textWidth) / 2, doc.internal.pageSize.height - 15);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generado el ${new Date().toLocaleString("es-ES")} - MizanMasjid`, 14, doc.internal.pageSize.height - 5);
    }

    doc.save("alumnos.pdf");
    setShowPdfDialog(false);
  };

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
    mutationFn: async (vars: any) => {
      console.log("Creando alumno...");
      const { error, data: newStudent } = await supabase.from("students").insert({
        first_name: vars.firstName, 
        last_name: vars.lastName, 
        mosque_id: mosqueId!,
        date_of_birth: vars.birthDate || null,
        tutor_name: vars.tutorName || null,
        contact_phone: vars.contactPhone || null,
        classroom_id: vars.classroomId || null,
        monthly_fee: Number(vars.monthlyFee) || 0,
        student_dni: vars.studentDni || null,
        tutor_dni: vars.tutorDni || null
      }).select().single();
      
      if (error) {
        console.error("Error insert:", error);
        throw error;
      }
      
      console.log("Alumno creado:", newStudent);

      if (vars.photoFile && newStudent) {
        console.log("Hay foto para subir:", vars.photoFile.name);
        const ext = vars.photoFile.name.split(".").pop();
        const path = `${mosqueId}/${newStudent.id}.${ext}`;
        
        console.log("Subiendo foto a:", path);
        const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, vars.photoFile, { upsert: true });
        
        if (!uploadError) {
          console.log("Foto subida. Obteniendo URL...");
          const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);
          console.log("Public URL:", publicUrl);
          
          const { error: updateError } = await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);
          if (updateError) {
            console.error("Error al actualizar la BD con la foto:", updateError);
          } else {
            console.log("BD actualizada con la foto!");
          }
        } else {
          console.error("Error al subir la foto:", uploadError);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      setFirstName(""); setLastName(""); setBirthDate(""); setTutorName(""); setContactPhone(""); setClassroomId(""); setMonthlyFee("0"); setStudentDni(""); setTutorDni(""); setPhotoFile(null); setShowForm(false);
      toast.success("Hecho");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  
  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Hecho"); },
  });

  const togglePayment = useMutation({
    mutationFn: async ({ studentId, month, current, fee }: { studentId: string; month: number; current: boolean; fee: number }) => {
      if (current) {
        await supabase.from("student_payments").delete().eq("student_id", studentId).eq("year", year).eq("month", month);
      } else {
        const now = new Date();
        await supabase.from("student_payments").insert({ student_id: studentId, year, month, paid: true, amount: fee, payment_year: now.getFullYear(), payment_month: now.getMonth() + 1 });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-payments-all"] }),
  });

  
  const studentsWithNumber = React.useMemo(() => {
    if (!students) return [];
    return [...students].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((s, idx) => ({ ...s, enrollment_number: idx + 1 }));
  }, [students]);

  const filtered = studentsWithNumber.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.enrollment_number && s.enrollment_number.toString() === search)
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
        <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto mt-3 md:mt-0">
          
          <Button variant="outline" className="text-xs" onClick={() => setShowPdfDialog(true)}>
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
          {canModifyData() && (
            <Button size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("enroll_student") as string}
            </Button>
          )}
        </div>
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
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Foto del Alumno (Opcional)</label>
                <div className="flex items-center gap-4">
                  {photoFile && <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-10 w-10 object-cover rounded-full" />}
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
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

              const currentStudents = qc.getQueryData(["students", mosqueId]);
                addStudent.mutate({ firstName, lastName, birthDate, tutorName, contactPhone, classroomId, monthlyFee, studentDni, tutorDni, photoFile });
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
                    <p className="text-sm font-medium"><span className="text-muted-foreground mr-1 font-mono text-xs">#{s.enrollment_number || "-"}</span> {s.first_name} {s.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(s as any).classrooms?.name || t("no_classrooms") as string}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto mx-4 pb-2 sm:pb-0 hide-scrollbar">
                  <div className="flex gap-1.5 min-w-max">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      const isPaid = isMonthPaid(s.id, monthNum);
                      const isInactive = ((s as any).classrooms?.inactive_months || []).includes(monthNum);
                      return (
                        <button key={i} disabled={!canModifyData() || isInactive}
                          onClick={() => togglePayment.mutate({ studentId: s.id, month: monthNum, current: isPaid, fee: Number(s.monthly_fee ?? 0) })}
                          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex flex-col items-center justify-center transition-all flex-shrink-0 ${
                            isInactive 
                              ? "bg-amber-100/50 text-amber-700/50 border border-amber-300/50 cursor-not-allowed"
                              : isPaid 
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                                : "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
                          } ${!canModifyData() ? "cursor-default" : ""}`}>
                          <span className="text-[9px] sm:text-[10px] font-medium leading-none mb-1">{months[i].substring(0, 3)}</span>
                          <span className="text-[10px] sm:text-xs leading-none">{isInactive ? "—" : isPaid ? "✓" : "·"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1">
                  <Link to="/alumnos/$studentId" params={{ studentId: s.id }} className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  {canModifyData() && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                      onClick={async () => { if (await confirm(t("confirm_delete") as string)) deleteStudent.mutate(s.id); }}>
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
              className="fixed top-safe mt-4 right-4 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors z-[200] border border-white/20 shadow-lg"
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

      {/* PDF Export Dialog */}
      {showPdfDialog && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-5 animate-scale-in relative">
            <h3 className="text-lg font-bold mb-4">Opciones de Exportación</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.number} onChange={e => setPdfFields(f => ({...f, number: e.target.checked}))} /> Número de Alumno</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.name} onChange={e => setPdfFields(f => ({...f, name: e.target.checked}))} /> Nombre</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.lastname} onChange={e => setPdfFields(f => ({...f, lastname: e.target.checked}))} /> Apellidos</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.dni} onChange={e => setPdfFields(f => ({...f, dni: e.target.checked}))} /> DNI</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.classroom} onChange={e => setPdfFields(f => ({...f, classroom: e.target.checked}))} /> Aula</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.fee} onChange={e => setPdfFields(f => ({...f, fee: e.target.checked}))} /> Cuota Mensual</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.payments} onChange={e => setPdfFields(f => ({...f, payments: e.target.checked}))} /> Meses Pagados (Tabla de Colores)</label>
              
              <div className="h-px bg-border my-2"></div>
              
              <label className="flex items-center gap-2 text-sm font-semibold text-destructive"><input type="checkbox" checked={pdfFields.onlyDebtors} onChange={e => setPdfFields(f => ({...f, onlyDebtors: e.target.checked}))} /> Filtrar solo deudores (morosos)</label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPdfDialog(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={generatePdf}>Descargar PDF</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
