import { CreateStoryForm } from "@/components/CreateStoryForm";

export default function CreatePage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-amber-950">
        Créer une nouvelle histoire
      </h1>
      <p className="mt-2 text-amber-900/70">
        Racontez-nous votre idée et nous composerons un conte illustré.
      </p>
      <div className="mt-10 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm sm:p-8">
        <CreateStoryForm />
      </div>
    </div>
  );
}
