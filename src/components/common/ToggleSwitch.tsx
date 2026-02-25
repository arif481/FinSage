interface ToggleSwitchProps {
    checked: boolean
    label: string
    onChange: () => void
}

export const ToggleSwitch = ({ checked, label, onChange }: ToggleSwitchProps) => {
    return (
        <label className="toggle-switch">
            <input
                checked={checked}
                className="toggle-switch__input"
                type="checkbox"
                onChange={onChange}
            />
            <span className="toggle-switch__track">
                <span className="toggle-switch__thumb" />
            </span>
            <span className="toggle-switch__label">{label}</span>
        </label>
    )
}
