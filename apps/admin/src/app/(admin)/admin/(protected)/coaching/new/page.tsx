import { CoachingProgramForm } from "@/components/admin/CoachingProgramForm";
import { createCoachingProgram } from "../actions";

export default function NewCoachingProgramPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New coaching program</h1>
      <CoachingProgramForm action={createCoachingProgram} submitLabel="Create" />
    </div>
  );
}
