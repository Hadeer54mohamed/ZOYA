/**
 * ZOYA editorial headings — mono eyebrow + serif italic title (PasswordGate style).
 */

export function ZoyaEyebrow({ children, className = "", pink = false }) {
  return (
    <p
      className={[
        pink ? "zoya-eyebrow-pink" : "zoya-eyebrow",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}

const SIZE_CLASS = {
  sm: "zoya-heading-sm",
  md: "zoya-heading-md",
  lg: "zoya-heading-lg",
  xl: "zoya-heading-xl",
  hero: "zoya-heading-hero",
};

export default function ZoyaHeading({
  label,
  title,
  as: Tag = "h2",
  size = "lg",
  align = "left",
  pinkLabel = false,
  className = "",
  labelClassName = "",
  titleClassName = "",
  children,
}) {
  const alignClass = align === "center" ? "text-center" : "";

  return (
    <div className={[alignClass, className].filter(Boolean).join(" ")}>
      {label ? (
        <ZoyaEyebrow pink={pinkLabel} className={labelClassName}>
          {label}
        </ZoyaEyebrow>
      ) : null}
      <Tag
        className={[
          "zoya-heading font-semibold",
          SIZE_CLASS[size] ?? SIZE_CLASS.lg,
          label ? "mt-2 sm:mt-3" : "",
          titleClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title ?? children}
      </Tag>
    </div>
  );
}
