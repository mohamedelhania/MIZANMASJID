import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

// Add imports
code = code.replace(
  'import { createFileRoute, Navigate } from "@tanstack/react-router";',
  'import { createFileRoute, Navigate, Link } from "@tanstack/react-router";'
);
code = code.replace(
  'XCircle, Clock, FileText, ClipboardCheck, ArrowLeft, Loader2\r\n} from "lucide-react";',
  'XCircle, Clock, FileText, ClipboardCheck, ArrowLeft, Loader2, Eye\r\n} from "lucide-react";'
);
code = code.replace(
  'XCircle, Clock, FileText, ClipboardCheck, ArrowLeft, Loader2\n} from "lucide-react";',
  'XCircle, Clock, FileText, ClipboardCheck, ArrowLeft, Loader2, Eye\n} from "lucide-react";'
);

// Modify TabAlumnos rendering
const oldRender = `<div key={s.id} className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {s.first_name[0]}{s.last_name[0]}
            </div>
            <div>
              <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
              {s.contact_phone && <p className="text-[10px] text-muted-foreground">Tel: {s.contact_phone}</p>}
            </div>
          </div>`;

const newRender = `<div key={s.id} className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase relative overflow-hidden flex-shrink-0">
              {s.photo_url ? <img src={s.photo_url} alt="" className="h-full w-full object-cover absolute inset-0" /> : \`\${s.first_name[0]}\${s.last_name[0]}\`}
            </div>
            <div>
              <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
              {s.contact_phone && <p className="text-[10px] text-muted-foreground">Tel: {s.contact_phone}</p>}
            </div>
            <div className="ml-auto">
              <Link to="/alumnos/$studentId" params={{ studentId: s.id }} className="p-2 hover:bg-muted rounded-full block text-muted-foreground hover:text-primary transition-colors">
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>`;

code = code.replace(oldRender.replace(/\r\n/g, '\n'), newRender.replace(/\r\n/g, '\n'));
code = code.replace(oldRender.replace(/\n/g, '\r\n'), newRender.replace(/\n/g, '\r\n'));

fs.writeFileSync('src/routes/_app/aulas.tsx', code);
console.log('done');
