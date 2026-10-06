import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

code = code.replace('import { Download,  useConfirm } from "@/providers/ConfirmDialogProvider";', 'import { useConfirm } from "@/providers/ConfirmDialogProvider";');

if (!code.includes('Download,')) {
  code = code.replace('} from "lucide-react";', '  Download,\n} from "lucide-react";');
}

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
