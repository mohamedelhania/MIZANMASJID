import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
};

type ConfirmContextType = (options: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType>(() => Promise.resolve(false));

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<(value: boolean) => void>();
  const { t } = useI18n();

  const confirm = (opts: string | ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (typeof opts === "string") {
        setOptions({ description: opts, variant: "destructive" });
      } else {
        setOptions({ variant: "destructive", ...opts });
      }
      setResolver(() => resolve);
      setOpen(true);
    });
  };

  const handleConfirm = () => {
    setOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolver) resolver(false);
  };

  // When clicking outside or pressing Escape, Radix UI calls onOpenChange(false)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    }
  };

  const isDestructive = options.variant !== "default";
  
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-[400px] rounded-[32px] p-0 overflow-hidden border-0 shadow-2xl gap-0 sm:rounded-[32px] w-[90vw]">
          <div className={`pt-10 pb-6 px-6 text-center flex flex-col items-center justify-center space-y-5 ${isDestructive ? 'bg-red-50/40 dark:bg-red-950/20' : 'bg-primary/5'}`}>
            <div className={`h-20 w-20 rounded-full flex items-center justify-center shadow-sm border-4 ${isDestructive ? 'bg-red-100 text-red-500 border-red-50 dark:bg-red-900/50 dark:border-red-900' : 'bg-primary/10 text-primary border-primary/5'}`}>
              {isDestructive ? <Trash2 className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
            </div>
            
            <div className="space-y-3">
              <AlertDialogTitle className="text-2xl font-display font-bold text-center">
                {options.title || (isDestructive ? "¿Estás seguro?" : "Confirmar")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base text-muted-foreground max-w-[280px] mx-auto">
                {options.description || (isDestructive ? (t("confirm_delete") as string) : "¿Seguro que deseas continuar?")}
              </AlertDialogDescription>
            </div>
          </div>
          
          <div className="px-6 pb-8 pt-2 flex flex-col gap-3 bg-background">
            <Button
              className={`w-full rounded-2xl h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all ${isDestructive ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {options.confirmText || (isDestructive ? "Sí, eliminar" : "Confirmar")}
            </Button>
            <Button
              className="w-full rounded-2xl h-14 text-lg font-medium border-2 hover:bg-muted/50"
              variant="outline"
              onClick={handleCancel}
            >
              {options.cancelText || (t("cancel") as string) || "Cancelar"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
