export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...props
}) {
  const classes = `button button-${variant} ${className}`;
  return href ? (
    <a className={classes} href={href} {...props}>
      {children}
    </a>
  ) : (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
