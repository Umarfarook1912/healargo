import { WhatsAppLeadStatus } from "@/types/whatsapp-lead";

const STATUS_STYLES: Record<WhatsAppLeadStatus, string> = {
  [WhatsAppLeadStatus.NEW]: "bg-warning-soft text-warning border-warning/25",
  [WhatsAppLeadStatus.CONTACTED]: "bg-info-soft text-info border-info/20",
  [WhatsAppLeadStatus.ORDERED]:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  [WhatsAppLeadStatus.LOST]: "bg-red-50 text-red-800 border-red-200",
};

export function whatsappLeadStatusClass(status: WhatsAppLeadStatus): string {
  return STATUS_STYLES[status] ?? STATUS_STYLES[WhatsAppLeadStatus.NEW];
}
