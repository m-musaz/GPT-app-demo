// Theme-aware class helpers
export const theme = {
  // Containers
  card: (isDark: boolean) =>
    isDark
      ? "bg-slate-900/80 border-white shadow-sm"
      : "bg-white border border-gray-200 shadow-xl",

  cardInner: (isDark: boolean) =>
    isDark
      ? "bg-black/40 border-slate-800/80"
      : "bg-slate-50 border-slate-200",

  surface: (isDark: boolean) =>
    isDark ? "bg-black/60" : "bg-slate-100",

  // Text
  textPrimary: (isDark: boolean) =>
    isDark ? "text-white" : "text-black",

  textSecondary: (isDark: boolean) =>
    isDark ? "text-white" : "text-slate-600",

  textMuted: (isDark: boolean) =>
    isDark ? "text-white" : "text-slate-500",

  buttonShadow: () =>
    'hover:shadow-xl transition-all duration-200 border shadow-md ',

  buttonBorder: (isDark: boolean) =>
    isDark ? "border-gray-200" : "border-gray-200",

  // Icon chips
  iconBg: (isDark: boolean) =>
    isDark ? "bg-sky-500/12" : "bg-sky-100/70",

  iconBgSuccess: (isDark: boolean) =>
    isDark ? "bg-emerald-500/12" : "bg-emerald-100/70",

  // Spinners
  spinner: (isDark: boolean) =>
    isDark ? "border-slate-700" : "border-slate-300",
};

