import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function StatusNotifications() {
  const { toast, dismiss } = useToast();
  
  // This component doesn't render anything visible
  // It just sets up the toast system for the whole app
  // toast notifications are handled by the Toaster component in App.tsx
  
  return null;
}
