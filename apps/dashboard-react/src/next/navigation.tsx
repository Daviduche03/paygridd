import {
  useSearchParams as useRRSearchParams,
  useLocation,
  useNavigate,
  useParams as useRRParams,
  Navigate as RRNavigate,
} from "react-router-dom";
import { useCallback } from "react";

export function useSearchParams() {
  const [searchParams] = useRRSearchParams();
  return searchParams;
}

export function usePathname() {
  return useLocation().pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: useCallback((to: string) => navigate(to), [navigate]),
    replace: useCallback((to: string) => navigate(to, { replace: true }), [navigate]),
    back: useCallback(() => navigate(-1 as any), [navigate]),
    prefetch: () => {},
  };
}

export function useParams() {
  return useRRParams();
}

export function notFound() {
  throw new Response("Not Found", { status: 404 });
}

export function redirect(url: string) {
  window.location.href = url;
  throw new Error(`Redirect to ${url}`);
}

export function Navigate(props: { to: string; replace?: boolean }) {
  return <RRNavigate to={props.to} replace={props.replace} />;
}

export const permanentRedirect = redirect;
