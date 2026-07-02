import { Button } from "ui/button";
import { Icons } from "ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";

type ReconnectProviderProps = {
  id: string;
  provider: string;
  enrollmentId: string | null;
  institutionId: string;
  referenceId?: string | null;
  accessToken: string | null;
  onComplete: (type: "reconnect" | "sync") => void;
  variant?: "button" | "icon";
};

export function ReconnectProvider({ variant }: ReconnectProviderProps) {
  if (variant === "button") {
    return (
      <Button variant="outline" disabled>
        Reconnect
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={70}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-7 h-7 flex items-center"
            disabled
          >
            <Icons.Reconnect size={16} />
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
          Reconnect
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
