import { CreateStoryForm } from "@/components/CreateStoryForm";

export default function CreatePage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-amber-950">
        Create a new story
      </h1>
      <p className="mt-2 text-amber-900/70">
        Tell us your idea and we&apos;ll craft an illustrated tale.
      </p>
      <div className="mt-10 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm sm:p-8">
        <CreateStoryForm />
      </div>
    </div>
  );
}
