import fs from 'fs';
const path = 'src/routes/__root.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import \{ AuthProvider \} from "@\/lib\/auth";/, 'import { AuthProvider } from "@/lib/auth";\nimport { ConfirmProvider } from "@/providers/ConfirmDialogProvider";');

code = code.replace(
`<AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>`,
`<AuthProvider>
          <ConfirmProvider>
            <Outlet />
            <Toaster richColors position="top-right" />
          </ConfirmProvider>
        </AuthProvider>`);

fs.writeFileSync(path, code);
