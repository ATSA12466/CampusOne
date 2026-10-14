import { pageMetadata } from "@/config/metadata";
import { SrcAppointments } from "@/features/src-dashboard/appointments";

export const metadata = pageMetadata(
  "SRC Appointments",
  "Review nominations, record direct SRC and committee appointments, and manage revocations.",
);
export const dynamic = "force-dynamic";

export default function SrcAppointmentsPage() {
  return <SrcAppointments />;
}
