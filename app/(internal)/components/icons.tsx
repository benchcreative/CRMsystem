type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

export function LeadsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 3h15l-5.5 7v6l-4 1.5v-7.5z" />
    </svg>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      <circle cx="14.5" cy="7" r="2" />
      <path d="M13 12.2c1.9.3 3.5 2.1 3.5 4.8" />
    </svg>
  );
}

export function QuotesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 2.5h7l3 3v12h-10z" />
      <path d="M12 2.5v3h3" />
      <path d="M7 10h6M7 13h6M7 7h3" />
    </svg>
  );
}

export function ScheduleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3.5 2" />
    </svg>
  );
}

export function MarketingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 8v4h3l5 3V5l-5 3z" />
      <path d="M14 7c1 .9 1 3.1 0 4M16.5 5.5c1.8 1.7 1.8 5.3 0 7" />
    </svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17V9M8.5 17V3M14 17v-6" />
      <path d="M2.5 17.5h15" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="15" height="14" rx="1.5" />
      <path d="M2.5 8h15M6.5 2v3M13.5 2v3" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
    </svg>
  );
}
