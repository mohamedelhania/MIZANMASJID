import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/mezquitas.tsx', 'utf8');

// 1. Add Trash2 import
code = code.replace(
  'MapPin, Eye, Users as UsersIcon, Map as MapIcon, List\r\n} from "lucide-react";',
  'MapPin, Eye, Users as UsersIcon, Map as MapIcon, List, Trash2\r\n} from "lucide-react";'
);
code = code.replace(
  'MapPin, Eye, Users as UsersIcon, Map as MapIcon, List\n} from "lucide-react";',
  'MapPin, Eye, Users as UsersIcon, Map as MapIcon, List, Trash2\n} from "lucide-react";'
);

// 2. Add deleteMosque mutation
const deleteMutationStr = `
  const deleteMosque = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mosques").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-mosques"] }); toast.success("Mezquita eliminada correctamente"); },
    onError: (e: Error) => toast.error(e.message),
  });
`;

const updateMutationStart = `  const updateStatus = useMutation({`;
code = code.replace(updateMutationStart, deleteMutationStr.trimStart() + "\n" + updateMutationStart);

// 3. Add delete button when suspended
const oldSuspendedBtn = `{m.status === "suspended" && (
                  <Button size="sm" variant="outline" className="text-xs gap-1"
                    onClick={() => updateStatus.mutate({ id: m.id, status: "active" })}>
                    <CheckCircle2 className="h-3 w-3" /> {t("verify_mosque") as string}
                  </Button>
                )}`;

const newSuspendedBtn = `{m.status === "suspended" && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs gap-1 flex-1"
                      onClick={() => updateStatus.mutate({ id: m.id, status: "active" })}>
                      <CheckCircle2 className="h-3 w-3" /> {t("verify_mosque") as string}
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs gap-1 flex-1"
                      onClick={() => { if(confirm("¿Seguro que deseas ELIMINAR esta mezquita por completo? Esta acción no se puede deshacer.")) deleteMosque.mutate(m.id); }}>
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </Button>
                  </>
                )}`;

code = code.replace(oldSuspendedBtn.replace(/\n/g, '\r\n'), newSuspendedBtn.replace(/\n/g, '\r\n'));
code = code.replace(oldSuspendedBtn, newSuspendedBtn);

fs.writeFileSync('src/routes/_app/mezquitas.tsx', code);
console.log('done');
