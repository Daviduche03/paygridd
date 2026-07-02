import { useState } from "react";
import { DropdownMenuItem } from "ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { clearAuthToken } from "@/utils/session";

export function SignOut() {
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoading(true);

    clearAuthToken();

    navigate("/login");
  };

  return (
    <DropdownMenuItem
      className="text-xs"
      data-track="User Signed Out"
      onClick={handleSignOut}
    >
      {isLoading ? "Loading..." : "Sign out"}
    </DropdownMenuItem>
  );
}
