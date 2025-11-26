interface ConnectButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "linkedin" | "figma" | "default";
}

export function ConnectButton({
  label,
  href,
  onClick,
  icon,
  variant = "default",
}: ConnectButtonProps) {
  const baseStyles =
    "w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-2";

  const variantStyles = {
    linkedin: "bg-[#0a66c2] hover:bg-[#004182]",
    figma: "bg-black hover:bg-gray-900",
    default: "bg-[#0a66c2] hover:bg-[#004182]",
  };

  const handleClick = () => {
    if (href) {
      window.open(href, "_blank");
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={handleClick}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

