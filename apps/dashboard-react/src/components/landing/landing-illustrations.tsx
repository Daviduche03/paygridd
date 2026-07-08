type Props = { className?: string };

const stroke = "currentColor";

export function InvoiceIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <rect x="48" y="20" width="104" height="128" rx="6" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
      <rect x="60" y="36" width="56" height="6" rx="2" fill={stroke} opacity="0.2" />
      <rect x="60" y="50" width="80" height="4" rx="1" fill={stroke} opacity="0.12" />
      <rect x="60" y="60" width="72" height="4" rx="1" fill={stroke} opacity="0.12" />
      <rect x="60" y="70" width="64" height="4" rx="1" fill={stroke} opacity="0.12" />
      <path d="M60 96h80M60 108h48" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      <circle cx="128" cy="118" r="18" stroke={stroke} strokeWidth="1.5" opacity="0.4" />
      <text x="128" y="123" textAnchor="middle" fill={stroke} fontSize="14" fontFamily="serif" opacity="0.5">
        ₦
      </text>
      <path
        d="M36 72 L48 72 L54 52 L66 108 L78 44 L90 72 L102 72"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function VirtualAccountIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <rect x="30" y="48" width="140" height="72" rx="8" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <rect x="42" y="60" width="32" height="22" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <rect x="42" y="90" width="80" height="5" rx="1" fill={stroke} opacity="0.15" />
      <rect x="42" y="100" width="56" height="5" rx="1" fill={stroke} opacity="0.1" />
      <circle cx="148" cy="72" r="16" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
      <path d="M140 72h16M148 64v16" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${108 + i * 14}, ${38 - i * 4})`}>
          <rect width="36" height="24" rx="4" stroke={stroke} strokeWidth="1" opacity={0.15 - i * 0.03} />
        </g>
      ))}
      <path
        d="M18 80 C30 60, 50 100, 30 48"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.5"
      />
    </svg>
  );
}

export function ReconciliationIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <circle cx="56" cy="80" r="28" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <circle cx="144" cy="80" r="28" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <path d="M84 80h32" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
      <circle cx="100" cy="80" r="6" fill="#10b981" opacity="0.6" />
      <rect x="40" y="68" width="32" height="5" rx="1" fill={stroke} opacity="0.15" />
      <rect x="40" y="78" width="24" height="5" rx="1" fill={stroke} opacity="0.1" />
      <rect x="128" y="68" width="32" height="5" rx="1" fill={stroke} opacity="0.15" />
      <rect x="128" y="78" width="24" height="5" rx="1" fill={stroke} opacity="0.1" />
      <path
        d="M100 48 L108 64 L124 64 L112 74 L116 90 L100 80 L84 90 L88 74 L76 64 L92 64 Z"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.2"
        transform="translate(0,-8)"
      />
    </svg>
  );
}

export function PayoutIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <rect x="52" y="36" width="96" height="88" rx="6" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <path d="M68 56h64M68 72h48M68 88h56" stroke={stroke} strokeWidth="1.5" opacity="0.15" />
      <path
        d="M100 108 L100 132 M88 120 L100 132 L112 120"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path d="M36 56 L52 72 L36 88" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      <rect x="24" y="60" width="8" height="24" rx="2" fill={stroke} opacity="0.1" />
      <rect x="160" y="52" width="16" height="40" rx="2" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <path d="M156 48h24v8h-24z M160 44h16v4h-16z" stroke={stroke} strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

export function ApiIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <path
        d="M60 40 L48 80 L72 80 Z M128 40 L140 80 L116 80 Z"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.3"
        strokeLinejoin="round"
      />
      <rect x="78" y="56" width="44" height="56" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
      <path d="M88 72h24M88 84h16M88 96h20" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      <circle cx="100" cy="112" r="3" fill="#10b981" opacity="0.6" />
      <path
        d="M48 120 Q100 140 152 120"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.15"
        strokeDasharray="3 5"
      />
    </svg>
  );
}

export function FlowSendIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <rect x="60" y="24" width="80" height="92" rx="6" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
      <rect x="72" y="40" width="40" height="5" rx="1" fill={stroke} opacity="0.2" />
      <rect x="72" y="52" width="56" height="4" rx="1" fill={stroke} opacity="0.1" />
      <rect x="72" y="62" width="48" height="4" rx="1" fill={stroke} opacity="0.1" />
      <path
        d="M148 70 L168 70 M160 62 L168 70 L160 78"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="70" r="12" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
      <path d="M40 70 L48 70 M44 66 L48 70 L44 74" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FlowReceiveIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <rect x="40" y="50" width="120" height="48" rx="8" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <circle cx="68" cy="74" r="14" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
      <path d="M64 74 L72 74 M68 70 L72 74 L68 78" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="92" y="64" width="52" height="5" rx="1" fill={stroke} opacity="0.15" />
      <rect x="92" y="76" width="36" height="5" rx="1" fill={stroke} opacity="0.1" />
      <path
        d="M32 74 C20 74 20 50 40 40"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

export function FlowSettleIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <circle cx="100" cy="70" r="40" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <circle cx="100" cy="70" r="28" stroke={stroke} strokeWidth="1" opacity="0.15" />
      <text x="100" y="76" textAnchor="middle" fill={stroke} fontSize="22" fontFamily="serif" opacity="0.45">
        ₦
      </text>
      <path
        d="M100 30 L100 10 M88 18 L100 10 L112 18"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <rect x="72" y="108" width="56" height="20" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <rect x="80" y="114" width="40" height="4" rx="1" fill={stroke} opacity="0.12" />
    </svg>
  );
}

export function AgencyIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <rect x="44" y="32" width="48" height="48" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.3" />
      <rect x="76" y="48" width="48" height="48" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.22" />
      <rect x="108" y="64" width="48" height="48" rx="4" stroke={stroke} strokeWidth="1.5" opacity="0.15" />
      <path d="M68 80 L92 96 L116 88" stroke="#10b981" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <circle cx="56" cy="108" r="8" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <circle cx="100" cy="120" r="8" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      <circle cx="144" cy="108" r="8" stroke={stroke} strokeWidth="1.5" opacity="0.15" />
    </svg>
  );
}

export function SaasIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <circle cx="100" cy="80" r="36" stroke={stroke} strokeWidth="1.5" opacity="0.25" />
      <path
        d="M100 44 A36 36 0 0 1 136 80"
        stroke="#10b981"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />
      <circle cx="100" cy="80" r="4" fill={stroke} opacity="0.35" />
      <path
        d="M100 80 L124 68"
        stroke={stroke}
        strokeWidth="1.5"
        opacity="0.3"
        strokeLinecap="round"
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={52 + i * 28}
          y={118}
          width="20"
          height="20"
          rx="3"
          stroke={stroke}
          strokeWidth="1"
          opacity={0.2 - i * 0.04}
        />
      ))}
    </svg>
  );
}

export function FinanceIllustration({ className }: Props) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden>
      <path
        d="M40 120 L72 88 L104 96 L136 56 L168 72"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
      <path d="M40 120 L168 120" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      <path d="M40 120 L40 40" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
      {[88, 96, 72].map((y, i) => (
        <rect
          key={y}
          x={60 + i * 36}
          y={y}
          width="16"
          height={120 - y}
          rx="2"
          fill={stroke}
          opacity={0.08 + i * 0.03}
        />
      ))}
    </svg>
  );
}