import { CheckIcon } from "./icons";
import type { ActionState } from "@/app/actions";

/**
 * The result line under a form: an error, a confirmation, or nothing. Shared so
 * that every form in the app reports itself the same way, and so the polite/
 * assertive live-region roles are decided once rather than per form.
 */
export default function FormFeedback({
  state,
  okText,
}: {
  state: ActionState;
  okText: string;
}) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="border-[3px] border-line bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
      >
        {state.error}
      </p>
    );
  }

  if (state.ok) {
    return (
      <p
        role="status"
        className="flex items-center gap-1.5 border-[3px] border-line bg-success-soft px-3 py-2 text-sm font-bold text-success"
      >
        <CheckIcon className="size-4" />
        {okText}
      </p>
    );
  }

  return null;
}
