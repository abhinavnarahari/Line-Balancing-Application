
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function ToggleSwitch({ checked, onChange, disabled, size = "sm" }: ToggleSwitchProps) {
  return (
    <label
      className="switch"
      data-size={size}
      style={{
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        // Override size via inline style so it scales cleanly
        fontSize: size === "sm" ? "11px" : "17px",
        width:    size === "sm" ? "38px"  : "62px",
        height:   size === "sm" ? "22px"  : "35px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <span className="slider" />
    </label>
  );
}
