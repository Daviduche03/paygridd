import { Link as RRLink } from "react-router-dom";
import { forwardRef } from "react";

type LinkProps = {
  href: string;
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, prefetch, ...props }, ref) => {
    return (
      <RRLink ref={ref} to={href} {...props}>
        {children}
      </RRLink>
    );
  }
);

Link.displayName = "Link";

export default Link;
export { Link };
